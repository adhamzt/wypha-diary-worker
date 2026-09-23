'use client'

import { useEffect } from 'react'
import { SecurityProvider } from './security/SecurityProvider'
import { useDailyReminder } from '@/lib/reminders/useDailyReminder'

function ReminderBridge() {
  useDailyReminder()
  return null
}

function ThemeBridge({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const apply = () => {
      const stored = localStorage.getItem('logkerja-theme') || 'system'
      const dark = stored === 'dark' || (stored === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    const media = matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])
  return children
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ThemeBridge><SecurityProvider><ReminderBridge />{children}</SecurityProvider></ThemeBridge>
}
