import type { Metadata, Viewport } from 'next'
import './globals.css'
import { BottomNav } from '@/components/BottomNav'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'
import { NetworkStatus } from '@/components/NetworkStatus'
import { AppProviders } from '@/components/AppProviders'

export const metadata: Metadata = {
  title: { default: 'LogKerja', template: '%s · LogKerja' },
  description: 'Diary kerja personal local-first, offline-capable, terenkripsi, dan AI-assisted.',
  applicationName: 'LogKerja',
  appleWebApp: { capable: true, title: 'LogKerja', statusBarStyle: 'default' },
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' }
}

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#4f46e5'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <AppProviders>
          <ServiceWorkerRegister />
          <NetworkStatus />
          {children}
          <BottomNav />
        </AppProviders>
      </body>
    </html>
  )
}
