'use client'

import { useEffect } from 'react'
import { db } from '@/lib/db/db'
import { localDateKey } from '@/lib/date'

function minuteOfDay(value: string) {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

export function useDailyReminder() {
  useEffect(() => {
    let stopped = false
    async function check() {
      const settings = await db.settings.get('app')
      if (stopped || !settings?.reminderEnabled || !settings.reminderTime || !('Notification' in window) || Notification.permission !== 'granted') return
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      const target = minuteOfDay(settings.reminderTime)
      const today = localDateKey()
      if (nowMin >= target && nowMin <= target + 15 && settings.lastReminderDate !== today) {
        const registration = await navigator.serviceWorker?.ready
        await registration?.showNotification('Waktunya LogKerja', { body: 'Catat satu hal yang Anda selesaikan hari ini. Kurang dari 10 detik.', icon: '/icon-192.png', badge: '/icon-192.png', tag: `daily-${today}` })
        await db.settings.update('app', { lastReminderDate: today, updatedAt: new Date().toISOString() })
      }
    }
    void check()
    const timer = window.setInterval(() => void check(), 60_000)
    return () => { stopped = true; window.clearInterval(timer) }
  }, [])
}
