import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shakespearean Translator',
  description: 'Transform your text into eloquent Shakespearean English',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

