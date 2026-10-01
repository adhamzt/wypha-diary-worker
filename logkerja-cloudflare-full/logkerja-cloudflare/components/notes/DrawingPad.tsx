'use client'

import { useEffect, useRef, useState } from 'react'

export function DrawingPad({ onSave }: { onSave: (blob: Blob) => Promise<void> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [color, setColor] = useState('#4338ca')
  const [busy, setBusy] = useState(false)
  useEffect(() => { const ctx = canvas.current?.getContext('2d'); if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 720, 420) } }, [])
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    return { x: (event.clientX - box.left) * 720 / box.width, y: (event.clientY - box.top) * 420 / box.height }
  }
  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return
    const p = point(event); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + .01, p.y); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); drawing.current = true
  }
  function move(event: React.PointerEvent<HTMLCanvasElement>) { if (!drawing.current) return; const ctx = canvas.current?.getContext('2d'); const p = point(event); ctx?.lineTo(p.x, p.y); ctx?.stroke() }
  async function save() { const blob = await new Promise<Blob | null>(resolve => canvas.current?.toBlob(resolve, 'image/png')); if (!blob) return; setBusy(true); try { await onSave(blob) } finally { setBusy(false) } }
  return <div className="space-y-2"><canvas ref={canvas} width={720} height={420} className="w-full rounded-xl border border-slate-300 bg-white" style={{ touchAction: 'none' }} onPointerDown={start} onPointerMove={move} onPointerUp={() => { drawing.current = false }} onPointerCancel={() => { drawing.current = false }}/><div className="flex flex-wrap items-center gap-2"><label className="text-sm">Warna <input type="color" value={color} onChange={e => setColor(e.target.value)}/></label><button className="btn-secondary" type="button" onClick={() => { const ctx = canvas.current?.getContext('2d'); if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 720, 420) } }}>Bersihkan</button><button className="btn-primary" type="button" disabled={busy} onClick={() => void save()}>Simpan gambar</button></div></div>
}
