import type { AppSettings, DiaryTemplate } from '@/types'

export const defaultTemplates: DiaryTemplate[] = [
  { id: 'daily', name: 'Harian', fields: ['activity', 'problem', 'solution', 'lesson', 'duration', 'tags'], isDefault: true, builtIn: true },
  { id: 'meeting', name: 'Meeting', fields: ['activity', 'lesson', 'tags'], starterText: 'Topik meeting:\nKeputusan:\nNext action:', isDefault: false, builtIn: true },
  { id: 'incident', name: 'Insiden', fields: ['activity', 'problem', 'solution', 'lesson', 'impact', 'tags'], starterText: 'Insiden:\nDampak:', isDefault: false, builtIn: true },
  { id: 'retro', name: 'Retrospective', fields: ['activity', 'problem', 'solution', 'lesson', 'tags'], starterText: 'Yang berjalan baik:\nYang perlu diperbaiki:', isDefault: false, builtIn: true },
  { id: 'star', name: 'STAR', fields: ['activity', 'problem', 'solution', 'impact', 'skills', 'tags'], starterText: 'Situation:\nTask:\nAction:\nResult:', isDefault: false, builtIn: true }
]

export function defaultSettings(): AppSettings {
  const now = new Date().toISOString()
  return {
    id: 'app', onboardingComplete: false, role: 'employee', theme: 'system', language: 'id',
    reminderEnabled: false, aiEnabled: false, createdAt: now, updatedAt: now, defaultTemplateId: 'daily'
  }
}
