import { Suspense } from 'react'
import { EntryDetail } from '@/components/EntryDetail'
export default function EntryPage(){return <Suspense fallback={<main className="app-shell"><div className="card h-80 animate-pulse bg-slate-100 dark:bg-slate-800"/></main>}><EntryDetail/></Suspense>}
