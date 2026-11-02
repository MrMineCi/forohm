'use client'

import { useActionState } from 'react'
import { addTransaction, type FormState } from '@/app/actions'

export default function TransactionForm({ teamId, today }: { teamId: string; today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    addTransaction.bind(null, teamId),
    {}
  )

  return (
    <form action={action} className="stack panel">
      <h2>บันทึกผลวันนี้</h2>

      <fieldset className="kind">
        <legend className="sr">ได้หรือเสีย</legend>
        <label className="kind-win">
          <input type="radio" name="kind" value="win" defaultChecked />
          <span>ได้</span>
        </label>
        <label className="kind-loss">
          <input type="radio" name="kind" value="loss" />
          <span>เสีย</span>
        </label>
      </fieldset>

      <div className="row">
        <label className="field grow">
          <span>จำนวนเงิน (บาท)</span>
          <input name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required />
        </label>
        <label className="field">
          <span>วันที่</span>
          <input name="played_on" type="date" defaultValue={today} required />
        </label>
      </div>

      <label className="field">
        <span>หมายเหตุ (ไม่บังคับ)</span>
        <input name="note" maxLength={200} placeholder="เช่น แข่งกับทีม B รอบรองฯ" />
      </label>

      {state.error && <p className="msg err" role="alert">{state.error}</p>}
      {state.ok && <p className="msg ok" role="status">{state.ok}</p>}

      <button className="btn" disabled={pending}>{pending ? 'กำลังบันทึก…' : 'บันทึก'}</button>
    </form>
  )
}
