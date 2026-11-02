'use client'

import { useActionState, useState } from 'react'
import { authenticate, type AuthState } from './actions'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [state, action, pending] = useActionState<AuthState, FormData>(authenticate, {})

  return (
    <main className="narrow">
      <h1 className="page-title">{mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</h1>
      <p className="muted">บันทึกว่าทีมได้หรือเสียเท่าไหร่ในแต่ละวัน</p>

      <form action={action} className="stack panel">
        <input type="hidden" name="mode" value={mode} />

        {mode === 'register' && (
          <label className="field">
            <span>ชื่อที่แสดง</span>
            <input name="display_name" autoComplete="nickname" required />
          </label>
        )}
        <label className="field">
          <span>อีเมล</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="field">
          <span>รหัสผ่าน</span>
          <input
            name="password"
            type="password"
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />
        </label>

        {state.error && <p className="msg err" role="alert">{state.error}</p>}
        {state.message && <p className="msg ok" role="status">{state.message}</p>}

        <button className="btn" disabled={pending}>
          {pending ? 'รอสักครู่…' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </button>
      </form>

      <p className="muted">
        {mode === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'}{' '}
        <button
          type="button"
          className="linklike"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </button>
      </p>
    </main>
  )
}
