interface Env { OPENAI_API_KEY?: string; OPENAI_MODEL?: string; AI_ACCESS_TOKEN?: string }
interface Context { request: Request; env: Env }

const modes: Record<string,string> = {
  weekly: 'Buat weekly work reflection: ringkasan eksekutif, pencapaian, hambatan, solusi, pelajaran, dan 3 action item minggu depan.',
  monthly: 'Buat monthly work review: highlights, progres proyek, pola masalah, kontribusi/dampak, skill yang tumbuh, risiko, dan prioritas bulan depan.',
  brag: 'Buat brag document profesional. Kelompokkan pencapaian dan ubah bukti yang cocok ke format STAR (Situation, Task, Action, Result). Jangan mengarang hasil numerik yang tidak ada.',
  qa: 'Jawab pertanyaan pengguna hanya berdasarkan diary yang diberikan. Bedakan fakta diary dari inferensi. Jika bukti tidak cukup, katakan tidak cukup data.',
  'daily-prompts': 'Buat tepat 3 pertanyaan reflektif singkat, berbeda, relevan dengan pola diary terbaru, dalam Bahasa Indonesia. Jangan menghakimi.',
  patterns: 'Deteksi masalah berulang. Tampilkan pola, bukti contoh, kemungkinan akar masalah sebagai hipotesis (bukan fakta), dan solusi sistemik yang realistis.',
  'weekly-letter': 'Tulis surat reflektif hangat namun profesional kepada diri sendiri berdasarkan seminggu ini: apa yang bergerak maju, apa yang berat, apa yang dipelajari, dan fokus minggu depan.',
  'review-prep': 'Siapkan bahan performance review: pencapaian dengan bukti, tanggung jawab yang berkembang, tantangan dan respons, skill, kolaborasi, area pengembangan, dan sasaran periode berikutnya. Jangan melebih-lebihkan.',
  'whisper-structure': 'Ubah transkrip kerja mentah menjadi struktur: Aktivitas, Masalah, Solusi, Pelajaran, Dampak, Tag, Skill. Jangan menambahkan fakta yang tidak ada.'
}

function extractOutputText(data:any){
  if(typeof data?.output_text==='string')return data.output_text
  const parts:string[]=[]
  for(const item of data?.output||[]) for(const content of item?.content||[]) if(content?.type==='output_text'&&typeof content.text==='string')parts.push(content.text)
  return parts.join('\n')
}

export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env } = context
  if (!env.OPENAI_API_KEY) return Response.json({ error: 'OPENAI_API_KEY belum dikonfigurasi di Cloudflare.' }, { status: 503 })
  if (!env.AI_ACCESS_TOKEN) return Response.json({ error: 'AI_ACCESS_TOKEN wajib diset agar endpoint AI tidak terbuka untuk publik.' }, { status: 503 })
  const auth = request.headers.get('authorization') || ''
  if (auth !== `Bearer ${env.AI_ACCESS_TOKEN}`) return Response.json({ error: 'Token AI salah.' }, { status: 401 })
  let body:any
  try { body = await request.json() } catch { return Response.json({ error: 'JSON tidak valid.' }, { status: 400 }) }
  if (!modes[body.mode]) return Response.json({ error: 'Mode AI tidak dikenal.' }, { status: 400 })
  const entries = Array.isArray(body.entries) ? body.entries.slice(0, 300) : []
  const diary = JSON.stringify(entries).slice(0, 220_000)
  const userInput = body.mode === 'whisper-structure'
    ? `TRANSKRIP:\n${String(body.rawText || '').slice(0, 40_000)}`
    : `PERTANYAAN USER: ${String(body.question || '')}\n\nDATA DIARY (JSON):\n${diary}`
  const instructions = `Anda adalah reflection assistant untuk diary kerja personal. ${modes[body.mode]} Gunakan Bahasa Indonesia kecuali locale=en. Fokus pada bukti yang ada, jangan mengarang angka, nama, hasil, atau kejadian. Hindari diagnosis kesehatan/mental. Format jawaban dengan Markdown yang ringkas dan mudah diekspor.`
  const apiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: env.OPENAI_MODEL || 'gpt-5.6-luna', instructions, input: userInput, store: false, max_output_tokens: 2200 })
  })
  const data:any = await apiResponse.json().catch(() => ({}))
  if (!apiResponse.ok) return Response.json({ error: data?.error?.message || `OpenAI error ${apiResponse.status}` }, { status: 502 })
  return Response.json({ text: extractOutputText(data), model: env.OPENAI_MODEL || 'gpt-5.6-luna' })
}
