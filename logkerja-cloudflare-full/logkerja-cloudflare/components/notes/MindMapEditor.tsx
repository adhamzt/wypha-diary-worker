'use client'

import { useMemo, useState } from 'react'
import { Minus, Plus, ZoomIn, ZoomOut } from 'lucide-react'
import type { MindNode } from '@/types'

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899']

export function MindMapEditor({ nodes, onChange }: { nodes: MindNode[]; onChange: (nodes: MindNode[]) => void }) {
  const [zoom, setZoom] = useState(1)
  const layout = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>()
    const seen = new Set<string>()
    let leaf = 0
    function visit(id: string, depth: number): number {
      if (seen.has(id)) return leaf++ * 96 + 55
      seen.add(id)
      const children = nodes.filter(node => node.parentId === id && !seen.has(node.id))
      const ys = children.map(child => visit(child.id, depth + 1))
      const y = ys.length ? (ys[0] + ys[ys.length - 1]) / 2 : leaf++ * 96 + 55
      positions.set(id, { x: depth * 220 + 24, y })
      return y
    }
    nodes.filter(node => !node.parentId || !nodes.some(parent => parent.id === node.parentId)).forEach(root => visit(root.id, 0))
    return { positions, width: Math.max(520, ...[...positions.values()].map(p => p.x + 220)), height: Math.max(250, leaf * 96 + 60) }
  }, [nodes])

  function add(parentId: string | null) {
    const parent = nodes.find(n => n.id === parentId)
    onChange([...nodes, { id: crypto.randomUUID(), parentId, text: parentId ? 'Ide baru' : 'Ide utama', color: parent?.color || COLORS[nodes.length % COLORS.length] }])
  }
  function remove(id: string) {
    const removed = new Set([id])
    let changed = true
    while (changed) { changed = false; for (const node of nodes) if (node.parentId && removed.has(node.parentId) && !removed.has(node.id)) { removed.add(node.id); changed = true } }
    onChange(nodes.filter(n => !removed.has(n.id)))
  }

  return <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-slate-500">Tulis ide utama, lalu tambah cabang. Geser layar untuk melihat peta yang lebar.</p>
      <div className="flex gap-2"><button type="button" className="btn-secondary !min-h-9 !px-3" onClick={() => setZoom(z => Math.max(.6, z - .2))} aria-label="Perkecil"><ZoomOut size={17}/></button><button type="button" className="btn-secondary !min-h-9 !px-3" onClick={() => setZoom(z => Math.min(1.5, z + .2))} aria-label="Perbesar"><ZoomIn size={17}/></button></div>
    </div>
    {!nodes.length && <button type="button" className="btn-secondary" onClick={() => add(null)}><Plus size={16}/>Buat ide utama</button>}
    {nodes.length > 0 && <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950" aria-label="Peta pikiran">
      <div style={{ width: layout.width * zoom, height: layout.height * zoom, position: 'relative' }}>
        <div style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})`, transformOrigin: 'top left', position: 'relative' }}>
          <svg className="absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
            {nodes.map(node => {
              const parent = node.parentId && layout.positions.get(node.parentId), own = layout.positions.get(node.id)
              return parent && own ? <path key={node.id} d={`M ${parent.x + 170} ${parent.y} C ${parent.x + 196} ${parent.y}, ${own.x - 28} ${own.y}, ${own.x} ${own.y}`} fill="none" stroke={node.color} strokeWidth="3" opacity=".6"/> : null
            })}
          </svg>
          {nodes.map(node => {
            const pos = layout.positions.get(node.id)
            return pos && <div key={node.id} className="absolute w-[170px] rounded-2xl border bg-white p-2 shadow-sm dark:bg-slate-900" style={{ left: pos.x, top: pos.y - 34, borderColor: node.color }}>
              <input aria-label="Teks ide" className="w-full bg-transparent text-sm font-semibold outline-none" value={node.text} onChange={event => onChange(nodes.map(n => n.id === node.id ? { ...n, text: event.target.value } : n))}/>
              <div className="mt-1 flex items-center justify-between">
                <input type="color" aria-label="Warna cabang" value={node.color} onChange={event => onChange(nodes.map(n => n.id === node.id ? { ...n, color: event.target.value } : n))} className="h-5 w-6 cursor-pointer"/>
                <div className="flex gap-1"><button type="button" title="Tambah cabang" aria-label={`Tambah cabang dari ${node.text}`} onClick={() => add(node.id)}><Plus size={17}/></button><button type="button" title="Hapus cabang dan turunannya" aria-label={`Hapus ${node.text}`} onClick={() => remove(node.id)}><Minus size={17}/></button></div>
              </div>
            </div>
          })}
        </div>
      </div>
    </div>}
    {nodes.length > 0 && <button type="button" className="text-sm font-semibold text-indigo-600" onClick={() => add(null)}>+ Ide utama lain</button>}
  </section>
}
