// Запуск: npm test (node --test, типы снимаются самим Node 24).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, requiredForCompany, weekStart, pluralWeeks, type Activity } from '../src/lib/streaks.ts';

// Пятница, 13 ноября 2026, 20:00
const NOW = new Date(2026, 10, 13, 20, 0);
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86400000).toISOString();
const act = (userId: string, spaceId: string, d: number): Activity => ({ userId, spaceId, at: daysAgo(d) });

test('неделя начинается в понедельник', () => {
  const w = weekStart(NOW);
  assert.equal(w.getDay(), 1);
  assert.equal(w.getDate(), 9);
});

test('порог компании из Figma: max(2, ceil(30%))', () => {
  const table: Array<[number, number]> = [[2, 2], [3, 2], [5, 2], [8, 3], [10, 3], [15, 5]];
  for (const [n, need] of table) assert.equal(requiredForCompany(n), need, `компания из ${n}`);
});

test('личная серия: несколько действий за неделю = одна неделя', () => {
  const s = computeStreak({
    kind: 'personal', spaceId: 'me', memberIds: ['me'], now: NOW,
    activities: [act('me', 'personal', 0), act('me', 'personal', 1), act('me', 'c1', 7), act('me', 'personal', 14)],
  });
  assert.equal(s.weeks, 3);
  assert.equal(s.status, 'active');
});

test('личная серия ждёт до конца воскресенья, а не обрывается', () => {
  const s = computeStreak({
    kind: 'personal', spaceId: 'me', memberIds: ['me'], now: NOW,
    activities: [act('me', 'personal', 7), act('me', 'personal', 14)],
  });
  assert.equal(s.weeks, 2);
  assert.equal(s.thisWeekDone, false);
  assert.equal(s.status, 'pending');
});

test('пропущенная неделя обрывает серию', () => {
  const s = computeStreak({
    kind: 'personal', spaceId: 'me', memberIds: ['me'], now: NOW,
    activities: [act('me', 'personal', 0), act('me', 'personal', 14), act('me', 'personal', 21)],
  });
  assert.equal(s.weeks, 1);
});

test('дуо засчитывается, только когда отметились оба', () => {
  const base = { kind: 'duo' as const, spaceId: 'd1', memberIds: ['me', 'sasha'], now: NOW };
  const one = computeStreak({ ...base, activities: [act('me', 'd1', 0), act('me', 'd1', 7), act('sasha', 'd1', 7)] });
  assert.equal(one.thisWeekDone, false);
  assert.equal(one.weeks, 1);
  assert.deepEqual(one.activeNow, ['me']);
  const both = computeStreak({ ...base, activities: [act('me', 'd1', 0), act('sasha', 'd1', 1)] });
  assert.equal(both.thisWeekDone, true);
});

test('личная запись не засчитывается в дуо', () => {
  const s = computeStreak({
    kind: 'duo', spaceId: 'd1', memberIds: ['me', 'sasha'], now: NOW,
    activities: [act('me', 'personal', 0), act('sasha', 'd1', 0)],
  });
  assert.equal(s.thisWeekDone, false);
});

test('компания из 8: нужно трое, один за всех не тянет', () => {
  const members = ['me', 'a', 'b', 'c', 'd', 'e', 'f', 'g'];
  const base = { kind: 'company' as const, spaceId: 'c1', memberIds: members, now: NOW };
  const two = computeStreak({ ...base, activities: [act('me', 'c1', 0), act('me', 'c1', 1), act('a', 'c1', 0)] });
  assert.equal(two.required, 3);
  assert.equal(two.thisWeekDone, false);
  const three = computeStreak({ ...base, activities: [act('me', 'c1', 0), act('a', 'c1', 0), act('b', 'c1', 2)] });
  assert.equal(three.thisWeekDone, true);
});

test('новый участник учитывается в пороге со следующего понедельника', () => {
  const members = ['me', 'a', 'b', 'c', 'd', 'e', 'f'];
  const joinedAt: Record<string, string> = Object.fromEntries(members.map((m) => [m, daysAgo(60)]));
  // восьмой участник пришёл вчера: порог на этой неделе ещё по 7 → 3 (а не по 8 → 3); проверим на 10
  const many = [...members, 'h', 'i', 'j'];
  for (const m of ['h', 'i', 'j']) joinedAt[m] = daysAgo(1);
  const s = computeStreak({
    kind: 'company', spaceId: 'c1', memberIds: many, joinedAt, createdAt: daysAgo(60), now: NOW,
    activities: [act('me', 'c1', 0), act('a', 'c1', 0)],
  });
  assert.equal(s.eligibleCount, 7);
  assert.equal(s.required, 3);
});

test('склонение недель', () => {
  assert.equal(pluralWeeks(1), '1 неделя');
  assert.equal(pluralWeeks(3), '3 недели');
  assert.equal(pluralWeeks(12), '12 недель');
  assert.equal(pluralWeeks(22), '22 недели');
});
