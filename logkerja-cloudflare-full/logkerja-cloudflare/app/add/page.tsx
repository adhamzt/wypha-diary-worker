import { Suspense } from 'react'
import { QuickCaptureForm } from '@/components/QuickCaptureForm'

export default function AddPage() {
  return (
    <Suspense fallback={<main className="app-shell"><div className="card h-96 animate-pulse bg-slate-100" /></main>}>
      <QuickCaptureForm />
    </Suspense>
  )
}
