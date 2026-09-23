import { db } from '@/lib/db/db'
import { getAttachmentBlob, listEntries } from '@/lib/repository/entries'
import { bytesToBase64, base64ToBytes, randomBytes, utf8, decodeUtf8 } from '@/lib/crypto/encoding'
import type { AppSettings, AttachmentRecord, LegacyWorkEntry } from '@/types'
import { defaultSettings } from '@/lib/db/defaults'

interface PortableAttachment { id:string; entryId:string; name:string; type:string; size:number; createdAt:string; data:string }
interface BackupBody { version:1; exportedAt:string; entries:Awaited<ReturnType<typeof listEntries>>; attachments:PortableAttachment[]; projects:unknown[]; tags:unknown[]; templates:unknown[]; summaries:unknown[]; focusSessions:unknown[]; integrationRuns:unknown[]; settings:Partial<AppSettings> }
interface BackupEnvelope { format:'logkerja-encrypted-backup'; version:1; kdf:'PBKDF2-SHA256'; iterations:number; salt:string; iv:string; cipher:string }

async function derive(password:string,salt:Uint8Array<ArrayBuffer>,iterations:number){ const base=await crypto.subtle.importKey('raw',utf8(password),'PBKDF2',false,['deriveKey']); return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']) }
function download(blob:Blob,name:string){ const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500) }

export async function createEncryptedBackup(password:string,key:CryptoKey|null){
  if(password.length<8)throw new Error('Password backup minimal 8 karakter.')
  const entries=await listEntries(key); const attachments:PortableAttachment[]=[]
  for(const e of entries) for(const meta of e.attachments){ const blob=await getAttachmentBlob(meta.id,key); const data=bytesToBase64(await blob.arrayBuffer()); attachments.push({...meta,entryId:e.id,data}) }
  const settings=await db.settings.get('app')
  const safeSettings:Partial<AppSettings>=settings?{...settings,security:undefined,aiAccessToken:undefined,aiEnabled:false}:{}
  const body:BackupBody={version:1,exportedAt:new Date().toISOString(),entries,attachments,projects:await db.projects.toArray(),tags:await db.tags.toArray(),templates:await db.templates.toArray(),summaries:await db.summaries.toArray(),focusSessions:await db.focusSessions.toArray(),integrationRuns:await db.integrationRuns.toArray(),settings:safeSettings}
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
  await db.transaction('rw',[db.entries,db.secureEntries,db.attachments,db.entryHistory,db.projects,db.tags,db.templates,db.summaries,db.drafts,db.secureDrafts,db.focusSessions,db.integrationRuns,db.settings],async()=>{
    await Promise.all([db.entries.clear(),db.secureEntries.clear(),db.attachments.clear(),db.entryHistory.clear(),db.projects.clear(),db.tags.clear(),db.templates.clear(),db.summaries.clear(),db.drafts.clear(),db.secureDrafts.clear(),db.focusSessions.clear(),db.integrationRuns.clear()])
    await db.entries.bulkPut(body.entries.map(e=>({...e}) as LegacyWorkEntry))
    const attachmentRows:AttachmentRecord[]=body.attachments.map(a=>({id:a.id,entryId:a.entryId,name:a.name,type:a.type,size:a.size,createdAt:a.createdAt,encrypted:false,blob:new Blob([base64ToBytes(a.data).buffer as ArrayBuffer],{type:a.type})}))
    if(attachmentRows.length)await db.attachments.bulkPut(attachmentRows)
    if(body.projects.length)await db.projects.bulkPut(body.projects as any[]); if(body.tags.length)await db.tags.bulkPut(body.tags as any[]); if(body.templates.length)await db.templates.bulkPut(body.templates as any[]); if(body.summaries.length)await db.summaries.bulkPut(body.summaries as any[]); if(body.focusSessions.length)await db.focusSessions.bulkPut(body.focusSessions as any[]); if(body.integrationRuns.length)await db.integrationRuns.bulkPut(body.integrationRuns as any[])
    const current=(await db.settings.get('app'))||defaultSettings(); await db.settings.put({...current,...body.settings,id:'app',security:undefined,aiAccessToken:undefined,aiEnabled:false,onboardingComplete:true,updatedAt:new Date().toISOString()} as AppSettings)
  })
  return body.entries.length
}
