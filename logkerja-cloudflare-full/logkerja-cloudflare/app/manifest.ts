import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'LogKerja — WorkDiary', short_name: 'LogKerja',
    description: 'Diary kerja local-first, offline, terenkripsi, dan AI-assisted.',
    start_url: '/', scope: '/', display: 'standalone',
    background_color: '#f8fafc', theme_color: '#4f46e5', orientation: 'portrait-primary',
    categories: ['productivity', 'business'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
    ],
    shortcuts: [
      { name: 'Catat Sekarang', short_name: 'Catat', url: '/add/', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'Timeline', short_name: 'Timeline', url: '/timeline/', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: 'Insights', short_name: 'Insights', url: '/insights/', icons: [{ src: '/icon-192.png', sizes: '192x192' }] }
    ],
    share_target: {
      action: '/share-target', method: 'POST', enctype: 'multipart/form-data',
      params: { title: 'title', text: 'text', url: 'url', files: [{ name: 'files', accept: ['image/*'] }] }
    }
  } as MetadataRoute.Manifest
}
