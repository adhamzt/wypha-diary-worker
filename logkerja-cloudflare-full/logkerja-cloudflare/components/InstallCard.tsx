'use client'

import { Download, Smartphone } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export function InstallCard() {
  const { canInstall, installed, install } = useInstallPrompt()

  if (installed) return null

  return (
    <section className="card flex items-center gap-4 p-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
        <Smartphone size={24} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold">Pasang LogKerja di Android</p>
        <p className="mt-0.5 text-sm text-slate-500">Buka lebih cepat dan tetap nyaman saat offline.</p>
      </div>
      {canInstall && (
        <button onClick={() => void install()} className="btn-secondary !min-h-10 !px-3" aria-label="Install aplikasi">
          <Download size={18} />
        </button>
      )}
    </section>
  )
}
