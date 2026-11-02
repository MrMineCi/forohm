'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthState = { error?: string; message?: string }

export async function authenticate(_: AuthState, formData: FormData): Promise<AuthState> {
  const mode = String(formData.get('mode'))
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const displayName = String(formData.get('display_name') ?? '').trim()

  if (!email || !password) return { error: 'ใส่อีเมลและรหัสผ่าน' }

  const supabase = await createClient()

  if (mode === 'register') {
    if (!displayName) return { error: 'ใส่ชื่อที่ต้องการให้แสดง' }
    if (password.length < 6) return { error: 'รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร' }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) return { error: error.message }
    if (!data.session) {
      return { message: 'สมัครแล้ว ตรวจอีเมลเพื่อกดยืนยัน จากนั้นกลับมาเข้าสู่ระบบ' }
    }
    redirect('/')
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
  redirect('/')
}
