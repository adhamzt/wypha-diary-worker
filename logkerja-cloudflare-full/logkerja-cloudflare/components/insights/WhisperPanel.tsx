'use client'

import { useCallback, useState } from 'react'
import { Mic, MicOff, WandSparkles } from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useSecurity } from '@/components/security/SecurityProvider'
import { runAI } from '@/lib/ai/client'

export function WhisperPanel(){const {settings}=useSecurity();const [raw,setRaw]=useState('');const [result,setResult]=useState('');const [busy,setBusy]=useState(false);const append=useCallback((t:string)=>setRaw(r=>r?`${r} ${t}`:t),[]);const voice=useVoiceInput(append,true)
async function structure(){if(!raw.trim())return;setBusy(true);try{if(settings?.aiEnabled&&settings.aiAccessToken&&navigator.onLine){const res=await runAI({mode:'whisper-structure',entries:[],rawText:raw,locale:settings.language},settings.aiAccessToken);setResult(res.text)}else{setResult(`Aktivitas: ${raw}\n\nMasalah: \nSolusi: \nPelajaran: \nDampak: \nTag: voice, draft\n\n(Fallback lokal: struktur dasar tanpa inferensi.)`)}}catch(err){setResult(err instanceof Error?err.message:'Gagal menstrukturkan transkrip.')}finally{setBusy(false)}}
return <section className="card mt-4 p-5"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">WHISPER MODE</p><h2 className="mt-1 font-black">Bicara panjang → struktur entry</h2></div>{voice.supported&&<button onClick={voice.toggle} className={`grid h-11 w-11 place-items-center rounded-2xl ${voice.listening?'bg-rose-100 text-rose-600':'bg-indigo-50 text-indigo-600'}`}>{voice.listening?<MicOff size={20}/>:<Mic size={20}/>}</button>}</div><textarea className="field mt-4" rows={5} value={raw} onChange={e=>setRaw(e.target.value)} placeholder="Bicara atau tempel transkrip pekerjaan…"/><button className="btn-secondary mt-3 w-full" disabled={busy||!raw.trim()} onClick={()=>void structure()}><WandSparkles size={18}/>{busy?'Menstrukturkan…':'Strukturkan transkrip'}</button>{result&&<pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 font-sans text-sm leading-6 dark:bg-slate-800">{result}</pre>}</section>}
