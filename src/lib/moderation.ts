import { supabase, humanError } from './supabase';

// Действия модератора. Права проверяет сама база (RLS + is_moderator()),
// поэтому обычный пользователь не сможет выполнить их, даже подделав запрос.

export type ReportRow = {
  id: number;
  reason: string;
  created_at: string;
  resolved: boolean;
  reporter: { nickname: string } | null;
  evening: { id: string; title: string; hidden: boolean; created_by: string } | null;
};

export type UserRow = { id: string; nickname: string; name: string; role: 'user' | 'moderator'; banned: boolean; created_at: string };

const check = <T,>(r: { data: T | null; error: unknown }): T => {
  if (r.error) throw new Error(humanError(r.error));
  return r.data as T;
};

export async function listReports(): Promise<ReportRow[]> {
  return check(
    await supabase
      .from('reports')
      .select('id, reason, created_at, resolved, reporter:profiles!reports_reporter_fkey(nickname), evening:evenings(id, title, hidden, created_by)')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(100),
  ) as unknown as ReportRow[];
}

export async function resolveReport(id: number) {
  check(await supabase.from('reports').update({ resolved: true }).eq('id', id));
}

export async function setEveningHidden(id: string, hidden: boolean) {
  check(await supabase.from('evenings').update({ hidden }).eq('id', id));
}

export async function deleteEvening(id: string) {
  check(await supabase.from('evenings').delete().eq('id', id));
}

export async function listUsers(q: string): Promise<UserRow[]> {
  const s = q.trim().replace(/^@/, '').replace(/[%,()]/g, '');
  let req = supabase.from('profiles').select('id, nickname, name, role, banned, created_at').order('created_at', { ascending: false }).limit(50);
  if (s) req = req.or(`nickname.ilike.%${s}%,name.ilike.%${s}%`);
  return check(await req) as UserRow[];
}

export async function setBanned(id: string, banned: boolean) {
  check(await supabase.from('profiles').update({ banned }).eq('id', id));
}

export async function setRole(id: string, role: 'user' | 'moderator') {
  check(await supabase.from('profiles').update({ role }).eq('id', id));
}
