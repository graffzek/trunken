/**
 * Логика «серийчиков» — по правилам со страницы Idea в Figma.
 *
 * - Период — неделя с понедельника 00:00 по воскресенье 23:59 (локальное время).
 * - Несколько действий за неделю = одна неделя. Важно участие, а не количество.
 * - Если на новой неделе ещё нет активности, серия не обрывается, а «ждёт» до конца воскресенья.
 * - Неделя без активности обрывает серию; следующее действие начинает новую с 1-й недели.
 * - Личный: хотя бы одно осмысленное действие пользователя (в любом пространстве).
 * - Дуо: каждый из двух участников сделал действие в общем пространстве.
 * - Компания: активны не меньше max(2, ceil(30% состава)) участников внутри компании.
 *   Новые участники учитываются в пороге со следующего понедельника.
 *
 * Модуль без зависимостей — его можно запускать тестами прямо в Node.
 */

export type Activity = {
  userId: string;
  /** 'personal' для личного дневника или id дуо/компании */
  spaceId: string;
  /** ISO-время действия */
  at: string;
};

export type StreakKind = 'personal' | 'duo' | 'company';

export type StreakInfo = {
  /** Сколько недель подряд засчитано (включая текущую, если она уже засчитана). */
  weeks: number;
  /** Засчитана ли текущая неделя. */
  thisWeekDone: boolean;
  /** active — неделя засчитана; pending — серия есть, но ждёт действия; none — серии нет. */
  status: 'active' | 'pending' | 'none';
  /** Кто уже отметился на этой неделе (для дуо и компании). */
  activeNow: string[];
  /** Сколько участников нужно на этой неделе. */
  required: number;
  /** Сколько участников учитывается в пороге на этой неделе. */
  eligibleCount: number;
};

const DAY = 24 * 60 * 60 * 1000;
const MAX_WEEKS_BACK = 520;

/** Понедельник 00:00 той недели, в которую попадает дата (локальное время). */
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // 0 = понедельник
  x.setDate(x.getDate() - dow);
  return x;
}

export function addWeeks(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n * 7);
  return x;
}

export function weekKey(d: Date): string {
  const w = weekStart(d);
  const m = String(w.getMonth() + 1).padStart(2, '0');
  const day = String(w.getDate()).padStart(2, '0');
  return `${w.getFullYear()}-${m}-${day}`;
}

/** Номер недели по ISO 8601 — для подписи «9–15 ноября · неделя 46». */
export function isoWeekNumber(d: Date): number {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x.getTime() - yearStart.getTime()) / DAY + 1) / 7);
}

/** Сколько участников компании нужно для продолжения серии. */
export function requiredForCompany(memberCount: number): number {
  return Math.max(2, Math.ceil(memberCount * 0.3));
}

type Params = {
  kind: StreakKind;
  /** Для personal — id пользователя; для дуо/компании — id пространства. */
  spaceId: string;
  /** Участники пространства (для personal — [userId]). */
  memberIds: string[];
  /** Когда участник вступил (ISO). Нужен компании для порога. */
  joinedAt?: Record<string, string>;
  /** Когда создано пространство (ISO). Участники первой недели учитываются сразу. */
  createdAt?: string;
  activities: Activity[];
  now?: Date;
};

/** Кто был активен в пространстве на каждой неделе: weekKey → множество userId. */
function activeByWeek(p: Params): Map<string, Set<string>> {
  const res = new Map<string, Set<string>>();
  const members = new Set(p.memberIds);
  for (const a of p.activities) {
    if (!members.has(a.userId)) continue;
    if (p.kind !== 'personal' && a.spaceId !== p.spaceId) continue;
    const k = weekKey(new Date(a.at));
    let s = res.get(k);
    if (!s) res.set(k, (s = new Set()));
    s.add(a.userId);
  }
  return res;
}

function eligibleMembers(p: Params, wStart: Date): string[] {
  if (p.kind !== 'company' || !p.joinedAt) return p.memberIds;
  const created = p.createdAt ? weekStart(new Date(p.createdAt)).getTime() : -Infinity;
  const firstWeek = wStart.getTime() === created;
  return p.memberIds.filter((id) => {
    const j = p.joinedAt?.[id];
    if (!j) return true;
    const jt = new Date(j).getTime();
    // В неделю создания учитываются все, кто вступил в эту неделю;
    // дальше — только вступившие до понедельника.
    return firstWeek ? jt < addWeeks(wStart, 1).getTime() : jt <= wStart.getTime();
  });
}

function weekDone(p: Params, active: Set<string> | undefined, wStart: Date): { done: boolean; required: number; eligible: number } {
  const n = active?.size ?? 0;
  if (p.kind === 'personal') return { done: n > 0, required: 1, eligible: 1 };
  if (p.kind === 'duo') {
    const all = p.memberIds.every((id) => active?.has(id));
    return { done: all, required: p.memberIds.length, eligible: p.memberIds.length };
  }
  const eligible = eligibleMembers(p, wStart).length;
  const required = requiredForCompany(eligible);
  return { done: n >= required, required, eligible };
}

export function computeStreak(p: Params): StreakInfo {
  const now = p.now ?? new Date();
  const byWeek = activeByWeek(p);
  const current = weekStart(now);
  const curActive = byWeek.get(weekKey(current));
  const cur = weekDone(p, curActive, current);

  let weeks = 0;
  let w = cur.done ? current : addWeeks(current, -1);
  for (let i = 0; i < MAX_WEEKS_BACK; i++) {
    if (!weekDone(p, byWeek.get(weekKey(w)), w).done) break;
    weeks++;
    w = addWeeks(w, -1);
  }

  return {
    weeks,
    thisWeekDone: cur.done,
    status: cur.done ? 'active' : weeks > 0 ? 'pending' : 'none',
    activeNow: [...(curActive ?? [])],
    required: cur.required,
    eligibleCount: cur.eligible,
  };
}

/** «1 неделя», «3 недели», «12 недель». */
export function pluralWeeks(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} неделя`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} недели`;
  return `${n} недель`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
