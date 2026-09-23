'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Lightbulb, ListTree, Plus, Settings } from 'lucide-react'

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/timeline/', label: 'Timeline', icon: ListTree },
  { href: '/add/', label: 'Tambah', icon: Plus, primary: true },
  { href: '/insights/', label: 'Insight', icon: Lightbulb },
  { href: '/settings/', label: 'Setelan', icon: Settings }
]

export function BottomNav() {
  const pathname = usePathname()
  if (pathname.startsWith('/onboarding')) return null
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-3xl border-t border-slate-200/80 bg-white/95 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95" aria-label="Navigasi utama">
      <div className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon, primary }) => {
          const base = href === '/' ? pathname === '/' : pathname.startsWith(href.replace(/\/$/, ''))
          return (
            <Link key={href} href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition ${primary ? '-mt-5 mx-2 bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : base ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} aria-current={base ? 'page' : undefined}>
              <Icon size={primary ? 24 : 21} strokeWidth={primary ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
