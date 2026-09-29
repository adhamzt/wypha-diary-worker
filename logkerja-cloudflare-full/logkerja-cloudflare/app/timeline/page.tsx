import type { Metadata } from 'next'
import { TimelineView } from '@/components/TimelineView'
import { Suspense } from 'react'

export const metadata: Metadata = { title: 'Timeline' }

export default function TimelinePage() {
  return <Suspense fallback={null}><TimelineView /></Suspense>
}
