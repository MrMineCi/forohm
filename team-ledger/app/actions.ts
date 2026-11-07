'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type FormState = { error?: string; ok?: string }

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function createTeam(_: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'ใส่ชื่อทีมก่อน' }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_team', { team_name: name })
  if (error) return { error: error.message }
  redirect(`/teams/${data}`)
}

export async function joinTeam(_: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get('code') ?? '').trim()
  if (!code) return { error: 'ใส่รหัสเชิญก่อน' }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('join_team', { code })
  if (error) return { error: error.message }
  redirect(`/teams/${data}`)
}

export async function addTransaction(
  teamId: string,
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const kind = String(formData.get('kind'))
  const amount = Number(formData.get('amount'))
  const playedOn = String(formData.get('played_on') ?? '')
  const note = String(formData.get('note') ?? '').trim()
  const photoPath = String(formData.get('photo_path') ?? '')

  if (kind !== 'win' && kind !== 'loss') return { error: 'เลือกว่าได้หรือเสีย' }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'ใส่จำนวนเงินมากกว่า 0' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(playedOn)) return { error: 'เลือกวันที่' }
  if (photoPath && !photoPath.startsWith(`${teamId}/`)) return { error: 'รูปไม่ถูกต้อง' }

  const supabase = await createClient()
  const { error } = await supabase.from('transactions').insert({
    team_id: teamId,
    kind,
    amount,
    played_on: playedOn,
    note: note || null,
    photo_path: photoPath || null,
  })
  if (error) return { error: error.message }

  revalidatePath(`/teams/${teamId}`)
  revalidatePath('/')
  return { ok: 'บันทึกแล้ว' }
}

export async function deleteTransaction(teamId: string, id: string) {
  const supabase = await createClient()

  const { data: tx } = await supabase
    .from('transactions')
    .select('photo_path')
    .eq('id', id)
    .maybeSingle()

  const { data: deleted } = await supabase.from('transactions').delete().eq('id', id).select('id')

  if (deleted?.length && tx?.photo_path) {
    await supabase.storage.from('slips').remove([tx.photo_path])
  }

  revalidatePath(`/teams/${teamId}`)
  revalidatePath('/')
}
