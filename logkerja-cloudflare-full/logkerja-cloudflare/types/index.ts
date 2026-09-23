export type Mood = 1 | 2 | 3 | 4 | 5
export type AppRole = 'employee' | 'freelancer' | 'designer' | 'developer' | 'student' | 'other'
export type ThemeMode = 'light' | 'dark' | 'system'
export type Language = 'id' | 'en'
export type SummaryPeriod = 'weekly' | 'monthly' | 'custom' | 'brag' | 'review' | 'letter' | 'patterns'

export interface EntryAttachment {
  id: string
  name: string
  type: string
  size: number
  createdAt: string
}

export interface WorkEntry {
  id: string
  date: string
  project?: string
  client?: string
  activity: string
  problem?: string
  solution?: string
  lesson?: string
  mood: Mood
  durationMin?: number
  tags: string[]
  attachments: EntryAttachment[]
  skills?: string[]
  impact?: string
  isAchievement?: boolean
  archived?: boolean
  createdAt: string
  updatedAt: string
  syncedAt?: string | null
}

export interface LegacyWorkEntry extends Omit<WorkEntry, 'attachments'> {
  attachments: Array<EntryAttachment & { blob?: Blob }>
}

export interface SecureEntryRecord {
  id: string
  cipher: ArrayBuffer
  iv: string
  updatedAt: string
}

export interface AttachmentRecord {
  id: string
  entryId: string
  name: string
  type: string
  size: number
  createdAt: string
  encrypted: boolean
  blob?: Blob
  cipher?: ArrayBuffer
  iv?: string
}

export interface EntryVersion {
  id: string
  entryId: string
  createdAt: string
  encrypted: boolean
  payload?: WorkEntry
  cipher?: ArrayBuffer
  iv?: string
}

export interface Project {
  id: string
  name: string
  client?: string
  color?: string
  status: 'active' | 'paused' | 'done'
  startedAt?: string
  endedAt?: string
}

export interface Tag { id: string; name: string; category?: string }

export interface DiaryTemplate {
  id: string
  name: string
  fields: Array<'activity' | 'problem' | 'solution' | 'lesson' | 'project' | 'client' | 'duration' | 'tags' | 'impact' | 'skills'>
  starterText?: string
  isDefault: boolean
  builtIn?: boolean
}

export interface BiometricVaultConfig {
  credentialId: string
  prfSalt: string
  wrappedKey: string
  wrapIv: string
}

export interface SecurityConfig {
  enabled: boolean
  pinSalt: string
  pinIterations: number
  wrappedKey: string
  wrapIv: string
  autoLockMin: number
  biometric?: BiometricVaultConfig
  enabledAt: string
}

export interface AppSettings {
  id: 'app'
  onboardingComplete: boolean
  role: AppRole
  theme: ThemeMode
  language: Language
  reminderTime?: string
  reminderEnabled: boolean
  aiEnabled: boolean
  aiAccessToken?: string
  defaultTemplateId?: string
  security?: SecurityConfig
  lastReminderDate?: string
  createdAt: string
  updatedAt: string
}

export interface Summary {
  id: string
  period: SummaryPeriod
  rangeStart: string
  rangeEnd: string
  title: string
  content: string
  source: 'ai' | 'offline'
  generatedAt: string
}

export interface EntryDraft extends Omit<WorkEntry, 'id' | 'createdAt' | 'updatedAt' | 'syncedAt'> {
  id: 'quick-capture'
  templateId?: string
  pendingFiles?: File[]
  updatedAt: string
}

export interface SecureDraftRecord {
  id: 'quick-capture'
  cipher: ArrayBuffer
  iv: string
  updatedAt: string
}

export interface FocusSession {
  id: string
  startedAt: string
  endedAt?: string
  plannedMin: number
  project?: string
  completed: boolean
  entryId?: string
}

export interface IntegrationRun {
  id: string
  provider: 'calendar' | 'github' | 'csv' | 'json' | 'trello' | 'notion' | 'slack'
  imported: number
  createdAt: string
  note?: string
}

export interface AIRequestPayload {
  mode: 'weekly' | 'monthly' | 'brag' | 'qa' | 'daily-prompts' | 'patterns' | 'weekly-letter' | 'review-prep' | 'whisper-structure'
  entries: Array<Pick<WorkEntry, 'date' | 'project' | 'client' | 'activity' | 'problem' | 'solution' | 'lesson' | 'mood' | 'durationMin' | 'tags' | 'skills' | 'impact' | 'isAchievement'>>
  question?: string
  locale?: Language
  rawText?: string
}
