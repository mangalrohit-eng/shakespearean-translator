import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Data & AI Opportunities Analyzer',
  description: 'AI-powered tool to identify and tag Data, AI, and Analytics opportunities from Comms & Media sector',
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

