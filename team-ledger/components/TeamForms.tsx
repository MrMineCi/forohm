'use client'

import { useActionState } from 'react'
import { createTeam, joinTeam, type FormState } from '@/app/actions'

export function CreateTeamForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createTeam, {})
  return (
    <form action={action} className="stack panel">
      <h2>สร้างทีมใหม่</h2>
      <label className="field">
        <span>ชื่อทีม</span>
        <input name="name" required maxLength={60} />
      </label>
      {state.error && <p className="msg err" role="alert">{state.error}</p>}
      <button className="btn" disabled={pending}>สร้างทีม</button>
    </form>
  )
}

export function JoinTeamForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(joinTeam, {})
  return (
    <form action={action} className="stack panel">
      <h2>เข้าร่วมทีมที่มีอยู่</h2>
      <label className="field">
        <span>รหัสเชิญ</span>
        <input name="code" required autoCapitalize="none" />
      </label>
      {state.error && <p className="msg err" role="alert">{state.error}</p>}
      <button className="btn ghost" disabled={pending}>เข้าร่วม</button>
    </form>
  )
}
