import Dexie, { type EntityTable } from 'dexie'
import type {
  AppSettings,
  AttachmentRecord,
  DiaryTemplate,
  EntryDraft,
  EntryVersion,
  FocusSession,
  IntegrationRun,
  LegacyWorkEntry,
  Project,
  SecureDraftRecord,
  SecureEntryRecord,
  Summary,
  Tag
} from '@/types'

export class WorkDiaryDB extends Dexie {
  entries!: EntityTable<LegacyWorkEntry, 'id'>
  secureEntries!: EntityTable<SecureEntryRecord, 'id'>
  attachments!: EntityTable<AttachmentRecord, 'id'>
  entryHistory!: EntityTable<EntryVersion, 'id'>
  projects!: EntityTable<Project, 'id'>
  tags!: EntityTable<Tag, 'id'>
  templates!: EntityTable<DiaryTemplate, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  summaries!: EntityTable<Summary, 'id'>
  drafts!: EntityTable<EntryDraft, 'id'>
  secureDrafts!: EntityTable<SecureDraftRecord, 'id'>
  focusSessions!: EntityTable<FocusSession, 'id'>
  integrationRuns!: EntityTable<IntegrationRun, 'id'>

  constructor() {
    super('workdiary')
    this.version(1).stores({
      entries: 'id, date, project, client, mood, createdAt, updatedAt, *tags',
      projects: 'id, name, client, status, startedAt',
      tags: 'id, name, category',
      templates: 'id, name, isDefault',
      settings: 'id',
      summaries: 'id, period, rangeStart, rangeEnd, generatedAt',
      drafts: 'id, updatedAt'
    })
    this.version(2).stores({
      entries: 'id, date, project, client, mood, createdAt, updatedAt, *tags',
      secureEntries: 'id, updatedAt',
      attachments: 'id, entryId, createdAt',
      entryHistory: 'id, entryId, createdAt, encrypted',
      projects: 'id, name, client, status, startedAt',
      tags: 'id, name, category',
      templates: 'id, name, isDefault, builtIn',
      settings: 'id',
      summaries: 'id, period, rangeStart, rangeEnd, generatedAt, source',
      drafts: 'id, updatedAt',
      secureDrafts: 'id, updatedAt',
      focusSessions: 'id, startedAt, completed, entryId',
      integrationRuns: 'id, provider, createdAt'
    })
  }
}

export const db = new WorkDiaryDB()
