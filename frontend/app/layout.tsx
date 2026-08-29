import React from "react"
import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'

import './globals.css'
import { ConsentProvider } from '@/components/consent-provider'

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-sans'
})
const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'ConsentLayer | Permission rails for the AI data economy',
  description: 'Machine-readable dataset permissions, wallet-signed licenses, and payment-backed receipts on 0G Galileo.',
  generator: 'ConsentLayer',
  keywords: ['AI data licensing', 'dataset permissions', '0G', 'data passport', 'AI usage receipts'],
  applicationName: 'ConsentLayer',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
  openGraph: {
    title: 'ConsentLayer | Permission rails for AI data',
    description: 'Define dataset rights, set prices, and issue portable AI usage receipts with native 0G payments.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ConsentLayer | Permission rails for AI data',
    description: 'Define dataset rights, set prices, and issue portable AI usage receipts with native 0G payments.',
  },
}

export const viewport: Viewport = { themeColor: '#102333', colorScheme: 'light' }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}><ConsentProvider>{children}</ConsentProvider></body>
    </html>
  )
}
