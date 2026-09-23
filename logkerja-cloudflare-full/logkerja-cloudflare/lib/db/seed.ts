import { createEntry } from '@/lib/repository/entries'
import { localDateKey } from '@/lib/date'
import type { Mood } from '@/types'

function daysAgo(days:number){const d=new Date();d.setDate(d.getDate()-days);return localDateKey(d)}
const demo:Array<{date:string;project:string;activity:string;problem?:string;solution?:string;lesson?:string;impact?:string;mood:Mood;durationMin:number;tags:string[];skills?:string[];isAchievement?:boolean}>=[
  {date:daysAgo(0),project:'Laporan Bulanan',activity:'Merapikan rekonsiliasi dan mengecek selisih data sebelum laporan dikirim.',problem:'Ada dua transaksi yang belum cocok dengan catatan pendukung.',solution:'Mencocokkan kembali nomor bukti dan membuat catatan tindak lanjut.',lesson:'Checklist kecil sebelum rekonsiliasi menghemat waktu pengecekan ulang.',mood:4,durationMin:75,tags:['keuangan','rekonsiliasi'],skills:['excel','analisis data']},
  {date:daysAgo(1),project:'Administrasi',activity:'Menyiapkan data pendukung untuk rapat koordinasi.',mood:3,durationMin:50,tags:['rapat'],skills:['komunikasi']},
  {date:daysAgo(2),project:'Perbaikan Proses',activity:'Membuat format pencatatan baru agar pencarian dokumen lebih cepat.',problem:'Penamaan dokumen lama tidak konsisten.',solution:'Membuat pola nama file dan kategori yang seragam.',impact:'Waktu pencarian dokumen turun dan format lebih mudah diaudit.',mood:5,durationMin:90,tags:['improvement','dokumen'],skills:['process improvement'],isAchievement:true},
  {date:daysAgo(4),project:'Laporan Bulanan',activity:'Validasi data sebelum finalisasi laporan.',mood:4,durationMin:60,tags:['keuangan'],skills:['quality assurance']},
  {date:daysAgo(6),project:'Learning',activity:'Mencatat pembelajaran tentang otomasi pekerjaan rutin.',lesson:'Mulai dari proses berulang yang kecil dan terukur.',mood:4,durationMin:30,tags:['learning','otomasi'],skills:['automation']}
]
export async function seedDemoEntries(key:CryptoKey|null){for(const e of demo)await createEntry({...e,client:undefined,files:[],syncedAt:null,archived:false},key);return demo.length}
