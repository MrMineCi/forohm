import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { baht, signedBaht, dateTH, todayBangkok } from '@/lib/format'
import { deleteTransaction } from '@/app/actions'
import TransactionForm from '@/components/TransactionForm'

type Tx = {
  id: string
  user_id: string
  kind: 'win' | 'loss'
  amount: number
  note: string | null
  played_on: string
  profiles: { display_name: string } | null
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: team } = await supabase
    .from('teams')
    .select('id, name, invite_code')
    .eq('id', id)
    .maybeSingle()
  if (!team) notFound()

  const { data: rows } = await supabase
    .from('transactions')
    .select('id, user_id, kind, amount, note, played_on, profiles(display_name)')
    .eq('team_id', id)
    .order('played_on', { ascending: false })
    .order('created_at', { ascending: false })

  const txs = (rows ?? []) as unknown as Tx[]

  let wins = 0
  let losses = 0
  const days = new Map<string, { items: Tx[]; net: number }>()
  for (const t of txs) {
    const amt = Number(t.amount)
    if (t.kind === 'win') wins += amt
    else losses += amt
    const day = days.get(t.played_on) ?? { items: [], net: 0 }
    day.items.push(t)
    day.net += t.kind === 'win' ? amt : -amt
    days.set(t.played_on, day)
  }
  const net = wins - losses

  return (
    <main className="wrap">
      <p><Link href="/" className="back">← ทีมทั้งหมด</Link></p>
      <h1 className="page-title">{team.name}</h1>

      <section className="ledger" aria-label="สรุปรวม">
        <div>
          <span className="k">ได้รวม</span>
          <span className="v win">฿{baht(wins)}</span>
        </div>
        <div>
          <span className="k">เสียรวม</span>
          <span className="v loss">฿{baht(losses)}</span>
        </div>
        <div className="net">
          <span className="k">สุทธิ</span>
          <span className={`v ${net > 0 ? 'win' : net < 0 ? 'loss' : ''}`}>{signedBaht(net)}</span>
        </div>
      </section>

      <div className="split">
        <TransactionForm teamId={team.id} today={todayBangkok()} />

        <section>
          <h2>ประวัติรายวัน</h2>
          {txs.length === 0 ? (
            <p className="empty">ยังไม่มีรายการ บันทึกผลแรกของทีมได้ที่ฟอร์ม</p>
          ) : (
            [...days.entries()].map(([date, day]) => (
              <div key={date} className="day">
                <div className="day-head">
                  <span>{dateTH(date)}</span>
                  <span className={`num ${day.net > 0 ? 'win' : day.net < 0 ? 'loss' : ''}`}>
                    {signedBaht(day.net)}
                  </span>
                </div>
                <ul>
                  {day.items.map((t) => (
                    <li key={t.id}>
                      <span className={`pill ${t.kind}`}>{t.kind === 'win' ? 'ได้' : 'เสีย'}</span>
                      <span className="grow">
                        <span className="num">฿{baht(Number(t.amount))}</span>
                        <span className="muted small">
                          {' '}โดย {t.profiles?.display_name ?? 'ไม่ทราบชื่อ'}
                          {t.note ? ` · ${t.note}` : ''}
                        </span>
                      </span>
                      {t.user_id === user?.id && (
                        <form action={deleteTransaction.bind(null, team.id, t.id)}>
                          <button className="linklike small" aria-label="ลบรายการนี้">ลบ</button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>

      <p className="invite muted">
        ชวนเพื่อนเข้าทีม: ให้ใส่รหัสเชิญ <code>{team.invite_code}</code> ที่หน้าแรก
      </p>
    </main>
  )
}
