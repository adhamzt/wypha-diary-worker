import type { AIRequestPayload, WorkArea, WorkEntry } from '@/types'
import { areaName } from '@/lib/work-areas'

export function sanitizeEntries(entries:WorkEntry[], areas:WorkArea[]=[]):AIRequestPayload['entries']{
  return entries.slice(0,300).map(({date,workAreaId,project,client,activity,problem,solution,lesson,mood,durationMin,tags,skills,impact,isAchievement})=>({date,workArea:areaName(areas,workAreaId),project,client,activity,problem,solution,lesson,mood,durationMin,tags,skills,impact,isAchievement}))
}
export async function runAI(payload:AIRequestPayload,token:string){
  const response=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},body:JSON.stringify(payload)})
  const data=await response.json().catch(()=>({}))
  if(!response.ok)throw new Error(data.error||`AI request gagal (${response.status})`)
  return data as {text:string;model:string}
}
