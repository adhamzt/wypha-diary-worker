'use client'

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Save, Trash2 } from 'lucide-react'
import { db } from '@/lib/db/db'
import type { DiaryTemplate } from '@/types'

const allFields:DiaryTemplate['fields']=['activity','problem','solution','lesson','project','client','duration','tags','impact','skills']
export function TemplatesManager(){
  const templates=useLiveQuery(()=>db.templates.toArray(),[],[]); const [name,setName]=useState(''); const [starter,setStarter]=useState(''); const [fields,setFields]=useState<DiaryTemplate['fields']>(['activity','problem','solution','lesson']); const [msg,setMsg]=useState('')
  function toggle(field:DiaryTemplate['fields'][number]){setFields(current=>current.includes(field)?current.filter(x=>x!==field):[...current,field])}
  async function add(){if(!name.trim())return; const row:DiaryTemplate={id:crypto.randomUUID(),name:name.trim(),fields:Array.from(new Set(['activity',...fields])) as DiaryTemplate['fields'],starterText:starter.trim()||undefined,isDefault:false,builtIn:false};await db.templates.add(row);setName('');setStarter('');setMsg('Template dibuat.')}
  async function setDefault(id:string){const rows=await db.templates.toArray();await db.transaction('rw',db.templates,db.settings,async()=>{for(const t of rows)await db.templates.update(t.id,{isDefault:t.id===id});const s=await db.settings.get('app');if(s)await db.settings.put({...s,defaultTemplateId:id,updatedAt:new Date().toISOString()})});setMsg('Template default diperbarui.')}
  async function remove(t:DiaryTemplate){if(t.builtIn)return;await db.templates.delete(t.id);setMsg('Template dihapus.')}
  return <main className="app-shell"><header className="pt-2"><p className="eyebrow">TEMPLATE</p><h1 className="mt-1 text-3xl font-black">Struktur catatan</h1><p className="mt-2 text-sm text-slate-500">Gunakan template agar capture cepat tetap konsisten untuk meeting, insiden, retro, atau STAR.</p></header>
    <section className="mt-5 space-y-3">{templates.map(t=><article key={t.id} className="card p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-black">{t.name}</h2>{t.isDefault&&<span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">DEFAULT</span>}{t.builtIn&&<span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800">BUILT-IN</span>}</div><p className="mt-1 text-xs text-slate-500">{t.fields.join(' · ')}</p>{t.starterText&&<p className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{t.starterText}</p>}</div><div className="flex gap-2"><button onClick={()=>void setDefault(t.id)} className="btn-secondary !min-h-9 !px-3 text-xs"><Save size={14}/>Default</button>{!t.builtIn&&<button onClick={()=>void remove(t)} className="btn-danger !min-h-9 !px-3"><Trash2 size={14}/></button>}</div></div></article>)}</section>
    <section className="card mt-5 p-5"><div className="flex items-center gap-2"><Plus size={18} className="text-indigo-500"/><h2 className="font-black">Template custom</h2></div><input className="field mt-4" value={name} onChange={e=>setName(e.target.value)} placeholder="Nama template"/><textarea className="field mt-3" rows={3} value={starter} onChange={e=>setStarter(e.target.value)} placeholder="Starter text opsional…"/><div className="mt-3 flex flex-wrap gap-2">{allFields.map(f=><button key={f} onClick={()=>toggle(f)} className={`chip ${fields.includes(f)?'!border-indigo-400 !bg-indigo-50 !text-indigo-700 dark:!bg-indigo-950':''}`}>{f}</button>)}</div><button onClick={()=>void add()} disabled={!name.trim()} className="btn-primary mt-4 w-full"><Plus size={18}/>Tambah template</button></section>{msg&&<p className="mt-3 text-center text-sm font-semibold text-emerald-600">{msg}</p>}
  </main>
}
