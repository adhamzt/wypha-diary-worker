import Link from 'next/link'
import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <main className="app-shell grid min-h-[80vh] place-items-center">
      <section className="card max-w-md p-8 text-center">
        <WifiOff className="mx-auto text-indigo-500" size={42} />
        <h1 className="mt-4 text-2xl font-black">Anda sedang offline</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">LogKerja tetap bisa mencatat, mencari, dan membaca data lokal. Fitur inti PWA dicache saat versi produksi selesai dipasang.</p>
        <Link href="/add" className="btn-primary mt-5">Catat Sekarang</Link>
      </section>
    </main>
  )
}
