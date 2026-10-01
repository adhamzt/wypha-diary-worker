import { db } from '@/lib/db/db'
import { getAttachmentBlob, listEntries } from '@/lib/repository/entries'
import { bytesToBase64, base64ToBytes, randomBytes, utf8, decodeUtf8 } from '@/lib/crypto/encoding'
import type { AppSettings, AttachmentRecord, DiaryTemplate, FocusSession, IntegrationRun, LegacyWorkEntry, Project, Summary, Tag } from '@/types'
import { defaultSettings } from '@/lib/db/defaults'
import { GENERAL_AREA } from '@/lib/work-areas'
import type { WorkArea } from '@/types'
import type { Note, NoteVersion } from '@/types'
import { getNoteMedia, listNoteHistory, listNotes } from '@/lib/repository/notes'

interface PortableAttachment { id:string; entryId:string; name:string; type:string; size:number; createdAt:string; data:string }
interface PortableNoteMedia { id:string; noteId:string; name:string; type:string; size:number; kind:'image'|'drawing'|'audio'; createdAt:string; data:string }
interface PortableNoteHistory { id:string; noteId:string; createdAt:string; payload:Note }
interface BackupBody { version:1; exportedAt:string; entries:Awaited<ReturnType<typeof listEntries>>; attachments:PortableAttachment[]; notes?:Note[]; noteMedia?:PortableNoteMedia[]; noteHistory?:PortableNoteHistory[]; projects:Project[]; workAreas?:WorkArea[]; tags:Tag[]; templates:DiaryTemplate[]; summaries:Summary[]; focusSessions:FocusSession[]; integrationRuns:IntegrationRun[]; settings:Partial<AppSettings> }
interface BackupEnvelope { format:'logkerja-encrypted-backup'; version:1; kdf:'PBKDF2-SHA256'; iterations:number; salt:string; iv:string; cipher:string }

async function derive(password:string,salt:Uint8Array<ArrayBuffer>,iterations:number){ const base=await crypto.subtle.importKey('raw',utf8(password),'PBKDF2',false,['deriveKey']); return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']) }
function download(blob:Blob,name:string){ const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500) }

export async function createEncryptedBackup(password:string,key:CryptoKey|null){
  if(password.length<8)throw new Error('Password backup minimal 8 karakter.')
  const entries=await listEntries(key); const attachments:PortableAttachment[]=[]
  for(const e of entries) for(const meta of e.attachments){ const blob=await getAttachmentBlob(meta.id,key); const data=bytesToBase64(await blob.arrayBuffer()); attachments.push({...meta,entryId:e.id,data}) }
  const notes=await listNotes(key); const noteMedia:PortableNoteMedia[]=[]; const noteHistory:PortableNoteHistory[]=[]
  for(const row of await db.noteMedia.toArray()){
    const blob=await getNoteMedia(row.id,key)
    noteMedia.push({id:row.id,noteId:row.noteId,name:row.name,type:row.type,size:row.size,kind:row.kind,createdAt:row.createdAt,data:bytesToBase64(await blob.arrayBuffer())})
  }
  for(const note of notes){
    for(const revision of await listNoteHistory(note.id,key)) noteHistory.push({id:crypto.randomUUID(),noteId:note.id,createdAt:revision.at,payload:revision.note})
  }
  const settings=await db.settings.get('app')
  const safeSettings:Partial<AppSettings>=settings?{...settings,security:undefined,aiAccessToken:undefined,aiEnabled:false}:{}
  const body:BackupBody={version:1,exportedAt:new Date().toISOString(),entries,attachments,notes,noteMedia,noteHistory,projects:await db.projects.toArray(),workAreas:await db.workAreas.toArray(),tags:await db.tags.toArray(),templates:await db.templates.toArray(),summaries:await db.summaries.toArray(),focusSessions:await db.focusSessions.toArray(),integrationRuns:await db.integrationRuns.toArray(),settings:safeSettings}
  const salt=randomBytes(16),iv=randomBytes(12),iterations=310000,k=await derive(password,salt,iterations)
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,utf8(JSON.stringify(body)))
  const envelope:BackupEnvelope={format:'logkerja-encrypted-backup',version:1,kdf:'PBKDF2-SHA256',iterations,salt:bytesToBase64(salt),iv:bytesToBase64(iv),cipher:bytesToBase64(cipher)}
  download(new Blob([JSON.stringify(envelope)],{type:'application/json'}),`logkerja-backup-${new Date().toISOString().slice(0,10)}.lkbackup`)
}

export async function restoreEncryptedBackup(file:File,password:string){
  const envelope=JSON.parse(await file.text()) as BackupEnvelope
  if(envelope.format!=='logkerja-encrypted-backup')throw new Error('Format backup tidak dikenali.')
  const k=await derive(password,base64ToBytes(envelope.salt),envelope.iterations)
  let body:BackupBody
  try{ const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64ToBytes(envelope.iv)},k,base64ToBytes(envelope.cipher)); body=JSON.parse(decodeUtf8(plain)) }catch{throw new Error('Password backup salah atau file rusak.')}
  if(!Array.isArray(body.entries)||!Array.isArray(body.attachments)||!Array.isArray(body.projects)||!Array.isArray(body.tags)||!Array.isArray(body.templates)||!Array.isArray(body.summaries)||!Array.isArray(body.focusSessions)||!Array.isArray(body.integrationRuns)||!Array.isArray(body.notes||[])||!Array.isArray(body.noteMedia||[])||!Array.isArray(body.noteHistory||[]))throw new Error('Isi backup tidak valid; data saat ini tetap aman.')
  const restoredNoteMedia=body.noteMedia?.map(a=>({id:a.id,noteId:a.noteId,name:a.name,type:a.type,size:a.size,kind:a.kind,createdAt:a.createdAt,encrypted:false,blob:new Blob([base64ToBytes(a.data).buffer as ArrayBuffer],{type:a.type})}))||[]
  const restoredHistory:NoteVersion[]=body.noteHistory?.map(v=>({...v,encrypted:false}))||[]
  await db.transaction('rw',[db.entries,db.secureEntries,db.attachments,db.entryHistory,db.projects,db.workAreas,db.tags,db.templates,db.summaries,db.drafts,db.secureDrafts,db.focusSessions,db.integrationRuns,db.settings,db.notes,db.secureNotes,db.noteMedia,db.noteHistory],async()=>{
    await Promise.all([db.entries.clear(),db.secureEntries.clear(),db.attachments.clear(),db.entryHistory.clear(),db.projects.clear(),db.workAreas.clear(),db.tags.clear(),db.templates.clear(),db.summaries.clear(),db.drafts.clear(),db.secureDrafts.clear(),db.focusSessions.clear(),db.integrationRuns.clear(),db.notes.clear(),db.secureNotes.clear(),db.noteMedia.clear(),db.noteHistory.clear()])
    await db.entries.bulkPut(body.entries.map(e=>({...e}) as LegacyWorkEntry))
    const attachmentRows:AttachmentRecord[]=body.attachments.map(a=>({id:a.id,entryId:a.entryId,name:a.name,type:a.type,size:a.size,createdAt:a.createdAt,encrypted:false,blob:new Blob([base64ToBytes(a.data).buffer as ArrayBuffer],{type:a.type})}))
    if(attachmentRows.length)await db.attachments.bulkPut(attachmentRows)
    if(body.notes?.length)await db.notes.bulkPut(body.notes)
    if(restoredNoteMedia.length)await db.noteMedia.bulkPut(restoredNoteMedia)
    if(restoredHistory.length)await db.noteHistory.bulkPut(restoredHistory)
    if(body.projects.length)await db.projects.bulkPut(body.projects); await db.workAreas.bulkPut(body.workAreas?.length ? body.workAreas : [GENERAL_AREA]); if(body.tags.length)await db.tags.bulkPut(body.tags); if(body.templates.length)await db.templates.bulkPut(body.templates); if(body.summaries.length)await db.summaries.bulkPut(body.summaries); if(body.focusSessions.length)await db.focusSessions.bulkPut(body.focusSessions); if(body.integrationRuns.length)await db.integrationRuns.bulkPut(body.integrationRuns)
    const current=(await db.settings.get('app'))||defaultSettings(); await db.settings.put({...current,...body.settings,id:'app',security:undefined,aiAccessToken:undefined,aiEnabled:false,onboardingComplete:true,updatedAt:new Date().toISOString()} as AppSettings)
  })
  return body.entries.length
}
