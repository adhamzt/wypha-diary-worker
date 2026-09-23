'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BriefcaseBusiness, Check, LockKeyhole, ScanFace, Sparkles } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/db'
import { ensureBootstrap } from '@/lib/db/bootstrap'
import { createPinVault, registerBiometric } from '@/lib/crypto/vault'
import { migratePlaintextToVault } from '@/lib/repository/entries'
import { useSecurity } from '@/components/security/SecurityProvider'
import type { AppRole } from '@/types'

const roles: Array<{id:AppRole;label:string}>=[{id:'employee',label:'Karyawan'},{id:'freelancer',label:'Freelancer'},{id:'designer',label:'Desainer'},{id:'developer',label:'Developer'},{id:'student',label:'Mahasiswa / magang'},{id:'other',label:'Lainnya'}]

export function OnboardingForm(){
  const router=useRouter(); const {setUnlockedKey,refreshSettings}=useSecurity(); const templates=useLiveQuery(()=>db.templates.toArray(),[],[])
  const [role,setRole]=useState<AppRole>('employee'); const [reminder,setReminder]=useState('17:00'); const [notify,setNotify]=useState(true); const [template,setTemplate]=useState('daily'); const [usePin,setUsePin]=useState(true); const [pin,setPin]=useState(''); const [pin2,setPin2]=useState(''); const [bio,setBio]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('')
  useEffect(()=>{void ensureBootstrap()},[])
  async function finish(){
    setError(''); if(usePin&&(pin.length<6||pin!==pin2)){setError('PIN minimal 6 karakter dan konfirmasi harus sama.');return}
    setBusy(true)
    try{
      const current=await db.settings.get('app'); if(!current) throw new Error('Settings belum siap.')
      let security=current.security; let unlocked:CryptoKey|null=null
      if(usePin){
        const vault=await createPinVault(pin,5); security=vault.config; unlocked=vault.key
        await migratePlaintextToVault(vault.key)
        if(bio){ try{ security={...security,biometric:await registerBiometric(vault.key)} }catch(err){ setError(`PIN aktif, tetapi biometric belum aktif: ${err instanceof Error?err.message:'tidak didukung'}`) } }
      }
      if(notify&&'Notification'in window&&Notification.permission==='default') await Notification.requestPermission()
      await db.settings.put({...current,onboardingComplete:true,role,reminderEnabled:notify,reminderTime:reminder,defaultTemplateId:template,security,updatedAt:new Date().toISOString()})
      if(unlocked) await setUnlockedKey(unlocked)
      await refreshSettings(); router.replace('/')
    }catch(err){setError(err instanceof Error?err.message:'Onboarding gagal.')}finally{setBusy(false)}
  }
  return <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-8 sm:px-6"><header className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200"><BriefcaseBusiness size={30}/></div><p className="eyebrow mt-5">SELAMAT DATANG</p><h1 className="mt-2 text-3xl font-black">Siapkan LogKerja</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Sekitar satu menit. Data tetap lokal di perangkat kecuali Anda sendiri memilih fitur online.</p></header>
    <div className="mt-7 space-y-4">
      <section className="card p-5"><h2 className="font-black">1. Peran Anda</h2><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{roles.map(r=><button key={r.id} onClick={()=>setRole(r.id)} className={`rounded-2xl border p-3 text-sm font-semibold ${role===r.id?'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950':'border-slate-200 dark:border-slate-700'}`}>{r.label}</button>)}</div></section>
      <section className="card p-5"><div className="flex items-center gap-2"><Bell size={18} className="text-indigo-500"/><h2 className="font-black">2. Reminder</h2></div><label className="mt-4 flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={notify} onChange={e=>setNotify(e.target.checked)} className="h-5 w-5 accent-indigo-600"/> Ingatkan saya setiap hari</label>{notify&&<input type="time" className="field mt-3" value={reminder} onChange={e=>setReminder(e.target.value)}/>}<p className="mt-2 text-xs leading-5 text-slate-500">Reminder lokal bekerja saat PWA aktif; browser dapat membatasi notifikasi terjadwal ketika aplikasi benar-benar tertutup.</p></section>
      <section className="card p-5"><div className="flex items-center gap-2"><Sparkles size={18} className="text-indigo-500"/><h2 className="font-black">3. Template default</h2></div><select className="field mt-3" value={template} onChange={e=>setTemplate(e.target.value)}>{templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></section>
      <section className="card p-5"><div className="flex items-center gap-2"><LockKeyhole size={18} className="text-emerald-600"/><h2 className="font-black">4. Proteksi lokal</h2></div><label className="mt-4 flex items-start gap-3 text-sm font-semibold"><input type="checkbox" checked={usePin} onChange={e=>setUsePin(e.target.checked)} className="mt-0.5 h-5 w-5 accent-indigo-600"/><span>Aktifkan enkripsi AES-GCM dengan PIN <span className="block text-xs font-normal text-slate-500">Direkomendasikan. PIN tidak dikirim ke server.</span></span></label>{usePin&&<div className="mt-4 grid gap-3 sm:grid-cols-2"><input className="field text-center tracking-[.25em]" type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value)} placeholder="PIN minimal 6"/><input className="field text-center tracking-[.25em]" type="password" inputMode="numeric" value={pin2} onChange={e=>setPin2(e.target.value)} placeholder="Ulangi PIN"/><label className="sm:col-span-2 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold dark:bg-slate-800"><input type="checkbox" checked={bio} onChange={e=>setBio(e.target.checked)} className="h-5 w-5 accent-indigo-600"/><ScanFace size={18}/> Coba aktifkan biometric WebAuthn PRF</label></div>} {!usePin&&<p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Tanpa PIN, entry tetap local-first tetapi disimpan plaintext di IndexedDB. Anda bisa mengaktifkan vault nanti di Settings.</p>}</section>
    </div>
    {error&&<p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
    <button disabled={busy} onClick={()=>void finish()} className="btn-primary mt-5 w-full"><Check size={19}/>{busy?'Menyiapkan…':'Mulai menggunakan LogKerja'}</button>
  </main>
}
