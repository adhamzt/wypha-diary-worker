'use client'

import { useEffect } from 'react'
import { db } from '@/lib/db/db'
import { offlineSummary } from '@/lib/ai/offline'
import type { WorkEntry } from '@/types'

function key(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function useAutoWeeklyRecap(entries:WorkEntry[]){useEffect(()=>{if(!entries.length)return;const now=new Date();if(now.getDay()!==1)return;const end=new Date(now);end.setDate(now.getDate()-1);const start=new Date(end);start.setDate(end.getDate()-6);const a=key(start),b=key(end);void(async()=>{const exists=await db.summaries.where('period').equals('weekly').filter(s=>s.rangeStart===a&&s.rangeEnd===b).first();if(exists)return;const selected=entries.filter(e=>e.date>=a&&e.date<=b&&!e.archived);if(!selected.length)return;await db.summaries.add({id:crypto.randomUUID(),period:'weekly',rangeStart:a,rangeEnd:b,title:'Weekly Recap Otomatis',content:offlineSummary(selected),source:'offline',generatedAt:new Date().toISOString()})})()},[entries])}
