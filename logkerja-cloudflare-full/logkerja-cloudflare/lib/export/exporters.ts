import type { WorkEntry } from '@/types'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}
function safe(value?: string) { return (value || '').replace(/"/g, '""') }
export function exportJson(entries: WorkEntry[], name='logkerja-export.json') { downloadBlob(new Blob([JSON.stringify(entries, null, 2)], {type:'application/json'}), name) }
export function buildMarkdown(entries: WorkEntry[]) {
  return entries.map(e => `## ${e.date} — ${e.project || 'Tanpa proyek'}\n\n**Aktivitas:** ${e.activity}\n\n${e.problem?`**Masalah:** ${e.problem}\n\n`:''}${e.solution?`**Solusi:** ${e.solution}\n\n`:''}${e.lesson?`**Pelajaran:** ${e.lesson}\n\n`:''}${e.impact?`**Dampak:** ${e.impact}\n\n`:''}**Mood:** ${e.mood}/5${e.durationMin?` · **Durasi:** ${e.durationMin} menit`:''}\n\n**Tag:** ${e.tags.map(t=>`#${t}`).join(' ')}\n`).join('\n---\n\n')
}
export function exportMarkdown(entries: WorkEntry[], name='logkerja-export.md') {
  downloadBlob(new Blob([buildMarkdown(entries)], {type:'text/markdown;charset=utf-8'}), name)
}
export async function shareMarkdown(entries: WorkEntry[]) {
  const text = buildMarkdown(entries)
  if (navigator.share) { await navigator.share({ title: 'LogKerja', text }); return true }
  exportMarkdown(entries)
  return false
}
export function exportCsv(entries: WorkEntry[], name='logkerja-export.csv') {
  const head=['date','project','client','activity','problem','solution','lesson','impact','mood','durationMin','tags','skills','achievement']
  const rows=entries.map(e=>[e.date,e.project,e.client,e.activity,e.problem,e.solution,e.lesson,e.impact,e.mood,e.durationMin,e.tags.join('|'),(e.skills||[]).join('|'),e.isAchievement?'yes':'no'].map(v=>`"${safe(String(v??''))}"`).join(','))
  downloadBlob(new Blob([[head.join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8'}),name)
}
export async function exportPdf(entries: WorkEntry[], title='Laporan LogKerja') {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({unit:'mm',format:'a4'})
  const margin=16, width=178; let y=18
  doc.setFontSize(18); doc.text(title,margin,y); y+=8
  doc.setFontSize(9); doc.setTextColor(100); doc.text(`Dibuat ${new Date().toLocaleString('id-ID')} · ${entries.length} catatan`,margin,y); y+=9; doc.setTextColor(20)
  for(const e of entries){
    const blocks=[`${e.date} · ${e.project||'Tanpa proyek'}`,e.activity,e.problem?`Masalah: ${e.problem}`:'',e.solution?`Solusi: ${e.solution}`:'',e.impact?`Dampak: ${e.impact}`:''].filter(Boolean)
    for(let i=0;i<blocks.length;i++){ const lines=doc.splitTextToSize(blocks[i],width); const need=lines.length*(i===0?5:4.5)+2; if(y+need>282){doc.addPage();y=18} doc.setFontSize(i===0?11:9); if(i===0)doc.setFont('helvetica','bold');else doc.setFont('helvetica','normal'); doc.text(lines,margin,y); y+=need }
    y+=3; doc.setDrawColor(220); doc.line(margin,y,width+margin,y); y+=6
  }
  doc.save(`logkerja-${new Date().toISOString().slice(0,10)}.pdf`)
}
