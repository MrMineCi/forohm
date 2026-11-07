'use client'

import { useActionState } from 'react'
import { addTransaction, type FormState } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'

async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('แปลงรูปไม่สำเร็จ'))),
      'image/jpeg',
      0.8
    )
  )
}

export default function TransactionForm({ teamId, today }: { teamId: string; today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (prev, formData) => {
      const file = formData.get('photo')
      formData.delete('photo')

      let path: string | null = null
      if (file instanceof File && file.size > 0) {
        if (!file.type.startsWith('image/')) return { error: 'เลือกไฟล์รูปภาพเท่านั้น' }
        try {
          const blob = await shrink(file)
          path = `${teamId}/${crypto.randomUUID()}.jpg`
          const { error } = await createClient()
            .storage.from('slips')
            .upload(path, blob, { contentType: 'image/jpeg' })
          if (error) return { error: `อัปโหลดรูปไม่สำเร็จ: ${error.message}` }
          formData.set('photo_path', path)
        } catch {
          return { error: 'อัปโหลดรูปไม่สำเร็จ ลองรูปอื่นหรือลองใหม่อีกครั้ง' }
        }
      }

      const result = await addTransaction(teamId, prev, formData)
      if (result.error && path) {
        await createClient().storage.from('slips').remove([path])
      }
      return result
    },
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

      <label className="field">
        <span>แนบรูป (ไม่บังคับ)</span>
        <input name="photo" type="file" accept="image/*" />
      </label>

      {state.error && <p className="msg err" role="alert">{state.error}</p>}
      {state.ok && <p className="msg ok" role="status">{state.ok}</p>}

      <button className="btn" disabled={pending}>{pending ? 'กำลังบันทึก…' : 'บันทึก'}</button>
    </form>
  )
}