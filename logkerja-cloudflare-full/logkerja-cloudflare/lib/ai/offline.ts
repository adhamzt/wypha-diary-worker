import type { WorkEntry } from '@/types'
import { localDateKey } from '@/lib/date'

const promptBank=[
  'Keputusan apa hari ini yang paling membutuhkan pertimbangan?', 'Apa pekerjaan kecil yang dampaknya ternyata lebih besar dari perkiraan?', 'Apa hambatan yang seharusnya bisa dicegah dengan sistem?',
  'Apa yang hari ini layak Anda ulangi minggu depan?', 'Siapa yang terbantu oleh pekerjaan Anda hari ini, dan bagaimana?', 'Apa satu hal yang membuat pekerjaan hari ini lebih lambat?',
  'Skill apa yang paling banyak Anda gunakan hari ini?', 'Apa bukti konkret bahwa sebuah pekerjaan sudah selesai dengan baik?', 'Apa yang ingin Anda jelaskan kepada diri sendiri tiga bulan dari sekarang?'
]
export function dailyPrompts(){const d=Number(localDateKey().replace(/-/g,''));return [0,1,2].map(i=>promptBank[(d*3+i)%promptBank.length])}
export function offlineSummary(entries:WorkEntry[]){
  if(!entries.length)return 'Belum ada data pada periode ini.'
  const minutes=entries.reduce((s,e)=>s+(e.durationMin||0),0);const avg=entries.reduce((s,e)=>s+e.mood,0)/entries.length
  const projects=Object.entries(entries.reduce<Record<string,number>>((a,e)=>{const k=e.project||'Tanpa proyek';a[k]=(a[k]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1])
  const issues=entries.filter(e=>e.problem).length; const solved=entries.filter(e=>e.solution).length;const achievements=entries.filter(e=>e.isAchievement).length
  return `## Ringkasan offline\n\n- **${entries.length}** catatan, **${Math.round(minutes/60*10)/10} jam** tercatat.\n- Mood rata-rata **${avg.toFixed(1)}/5**.\n- Proyek paling aktif: **${projects[0]?.[0]||'-'}** (${projects[0]?.[1]||0} catatan).\n- **${issues}** catatan memuat masalah; **${solved}** memuat solusi.\n- **${achievements}** ditandai sebagai pencapaian.\n\n### Fokus berikutnya\nPilih satu masalah yang berulang, tulis tindakan pencegahan, dan tandai dampaknya pada entry berikutnya.\n\n> Ini fallback statistik lokal, bukan analisis model AI.`
}
export function offlineBrag(entries:WorkEntry[]){const wins=entries.filter(e=>e.isAchievement||e.impact||e.mood===5);if(!wins.length)return 'Belum cukup bukti pencapaian. Tandai entry penting atau isi kolom Dampak.';return `# Brag Document — Draft Offline\n\n${wins.map((e,i)=>`## ${i+1}. ${e.project||'Pencapaian'} — ${e.date}\n**Situation/Task:** ${e.problem||e.activity}\n\n**Action:** ${e.solution||e.activity}\n\n**Result:** ${e.impact||'Tambahkan dampak terukur agar bagian Result lebih kuat.'}\n`).join('\n')}`}
export function problemPatterns(entries:WorkEntry[]){const problems=entries.filter(e=>e.problem);if(!problems.length)return 'Belum ada field masalah pada periode ini.';const words=new Map<string,number>();for(const e of problems){for(const w of (e.problem||'').toLowerCase().match(/[a-zA-ZÀ-ÿ]{5,}/g)||[]){if(['dengan','untuk','karena','belum','dalam','tidak','yangnya'].includes(w))continue;words.set(w,(words.get(w)||0)+1)}}const top=[...words.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6);return `## Pattern detector offline\n\nKata/tema yang sering muncul pada masalah: ${top.map(([w,n])=>`**${w}** (${n})`).join(', ')||'belum cukup pola'}.\n\nTinjau entry terkait sebelum menyimpulkan akar masalah. Fallback ini hanya menghitung kemunculan lokal.`}


export function offlineWeeklyLetter(entries:WorkEntry[]){
  if(!entries.length)return 'Belum ada catatan minggu ini untuk dibuatkan surat.'
  const wins=entries.filter(e=>e.isAchievement||e.impact).slice(0,3)
  const issues=entries.filter(e=>e.problem).slice(0,2)
  const lessons=entries.filter(e=>e.lesson).slice(0,2)
  return `# Surat untuk diri sendiri

Minggu ini kamu mencatat **${entries.length}** aktivitas kerja. ${wins.length?`Beberapa hal yang layak diingat: ${wins.map(e=>e.activity).join('; ')}.`:'Belum banyak pencapaian yang ditandai; minggu depan coba tandai hasil yang benar-benar terasa dampaknya.'}

${issues.length?`Yang cukup menguras perhatian: ${issues.map(e=>e.problem).join('; ')}. `:''}${lessons.length?`Pelajaran yang tercatat: ${lessons.map(e=>e.lesson).join('; ')}.`:''}

Untuk minggu depan, pilih satu prioritas utama, satu masalah yang ingin dicegah berulang, dan satu bukti dampak yang ingin dicatat.

> Dibuat oleh fallback lokal tanpa model AI.`
}

export function offlineReviewPrep(entries:WorkEntry[]){
  if(!entries.length)return 'Belum ada data untuk Review Prep.'
  const wins=entries.filter(e=>e.isAchievement||e.impact)
  const skills=[...new Set(entries.flatMap(e=>e.skills||[]))]
  const problems=entries.filter(e=>e.problem)
  return `# Review Prep — Draft Offline

## Pencapaian berbukti
${wins.length?wins.slice(0,8).map(e=>`- **${e.date}** ${e.activity}${e.impact?` — Dampak: ${e.impact}`:''}`).join('\n'):'- Belum ada entry yang ditandai sebagai pencapaian / memiliki dampak.'}

## Skill yang tercatat
${skills.length?skills.map(s=>`- ${s}`).join('\n'):'- Belum ada skill yang ditandai.'}

## Tantangan
${problems.length?problems.slice(0,6).map(e=>`- ${e.problem}${e.solution?` → Respons: ${e.solution}`:''}`).join('\n'):'- Belum ada masalah yang dicatat.'}

## Persiapan berikutnya
Lengkapi entry penting dengan konteks, tindakan, dan dampak konkret sebelum review formal.

> Draft ini merangkum data lokal; ia tidak menilai performa Anda.`
}
