import type { Metadata } from 'next'
import Link from 'next/link'
import { Prompt } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'
import './globals.css'

const prompt = Prompt({ subsets: ['thai', 'latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'สมุดบัญชีทีม',
  description: 'บันทึกรายได้และรายจ่ายจากการแข่งของแต่ละทีม',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let name = ''
  if (user) {
    const { data } = await supabase.from('profiles').select('display_name').eq('id', user.id).single()
    name = data?.display_name ?? user.email ?? ''
  }

  return (
    <html lang="th">
      <body className={prompt.className}>
        <header className="top">
          <Link href="/" className="brand">สมุดบัญชีทีม</Link>
          {user && (
            <form action={signOut} className="who">
              <span>{name}</span>
              <button className="linklike">ออกจากระบบ</button>
            </form>
          )}
        </header>
        {children}
      </body>
    </html>
  )
}
