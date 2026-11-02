import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signedBaht } from '@/lib/format'
import { CreateTeamForm, JoinTeamForm } from '@/components/TeamForms'

export default async function Home() {
  const supabase = await createClient()

  const { data: memberships } = await supabase
    .from('team_members')
    .select('role, teams(id, name)')
    .order('joined_at')

  const teams = (memberships ?? []).map((m: any) => m.teams).filter(Boolean) as {
    id: string
    name: string
  }[]

  const net = new Map<string, number>()
  if (teams.length) {
    const { data: tx } = await supabase
      .from('transactions')
      .select('team_id, kind, amount')
      .in('team_id', teams.map((t) => t.id))
    for (const t of tx ?? []) {
      const v = Number(t.amount) * (t.kind === 'win' ? 1 : -1)
      net.set(t.team_id, (net.get(t.team_id) ?? 0) + v)
    }
  }

  return (
    <main className="wrap">
      <h1 className="page-title">ทีมของคุณ</h1>

      {teams.length === 0 ? (
        <p className="empty">ยังไม่มีทีม สร้างทีมใหม่ หรือใส่รหัสเชิญจากเพื่อนด้านล่าง</p>
      ) : (
        <ul className="teams">
          {teams.map((t) => {
            const n = net.get(t.id) ?? 0
            return (
              <li key={t.id}>
                <Link href={`/teams/${t.id}`}>
                  <span className="team-name">{t.name}</span>
                  <span className={`num ${n > 0 ? 'win' : n < 0 ? 'loss' : ''}`}>{signedBaht(n)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <div className="two">
        <CreateTeamForm />
        <JoinTeamForm />
      </div>
    </main>
  )
}
