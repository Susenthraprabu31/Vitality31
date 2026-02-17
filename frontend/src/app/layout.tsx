import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Roboto } from 'next/font/google'
import { Open_Sans } from 'next/font/google'
import { Lato } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ["400"], display: 'swap', preload: true, variable: '--font-inter' })
const roboto = Roboto({ subsets: ['latin'], weight: ["400"], display: 'swap', preload: true, variable: '--font-roboto' })
const opensans = Open_Sans({ subsets: ['latin'], weight: ["400"], display: 'swap', preload: true, variable: '--font-opensans' })
const lato = Lato({ subsets: ['latin'], weight: ["400"], display: 'swap', preload: true, variable: '--font-lato' })

export const metadata: Metadata = {
  title: 'Generated App',
  description: 'Generated with Simplita',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body 
        className={[
          inter.variable,
          roboto.variable,
          opensans.variable,
          lato.variable,
          inter.className
        ].join(' ')}
      >
        {children}
      </body>
    </html>
  )
}