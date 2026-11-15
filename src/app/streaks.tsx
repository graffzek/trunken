import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, CheckLine, Label, Screen, Txt } from '@/components/ui';
import { TabBar } from '@/components/TabBar';
import { MY_ID, useStore } from '@/lib/store';
import { isoWeekNumber, plural, pluralWeeks, weekStart } from '@/lib/streaks';
import { dayMonth, weekRange } from '@/lib/format';
import { colors } from '@/theme';

const NUM_WORDS = ['ноль', 'одного', 'двоих', 'трёх', 'четырёх', 'пятерых', 'шестерых', 'семерых'];

// 03 · Серийчики
export default function Streaks() {
  const router = useRouter();
  const store = useStore();
  const now = new Date();
  const personal = store.personalStreak();
  const lastEvening = store.evenings.filter((e) => e.createdBy === MY_ID).sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <View style={{ flex: 1 }}>
      <Screen back title="Твои серийчики" withTabBar gap={14} contentStyle={{ paddingTop: 50 }}>
        <Txt size={14} weight="medium" lh={18} color={colors.graphite}>
          {weekRange(weekStart(now))} · неделя {isoWeekNumber(now)}
        </Txt>

        <Card tone="orange" style={{ gap: 0 }}>
          <Label color={colors.black}>ЛИЧНЫЙ</Label>
          <Txt size={28} weight="bold" lh={36} color={colors.black} style={{ marginTop: 8 }}>
            {personal.weeks > 0 ? `${pluralWeeks(personal.weeks)} подряд` : 'Серия ещё впереди'}
          </Txt>
          <View style={{ marginTop: 8 }}>
            <CheckLine text={personal.thisWeekDone ? 'Эта неделя засчитана' : 'Эта неделя ждёт твоего момента'} />
          </View>
          {lastEvening && (
            <Txt size={12} color={colors.black} style={{ marginTop: 8 }}>
              Ты сохранил воспоминание {dayMonth(lastEvening.date)}.
            </Txt>
          )}
        </Card>

        {store.duos.map((d) => {
          const friend = store.userById(d.friendId);
          const s = store.duoStreak(d);
          const friendDone = s.activeNow.includes(d.friendId);
          const meDone = s.activeNow.includes(MY_ID);
          const line =
            d.status === 'pending'
              ? `${friend.name} ещё не принял приглашение`
              : s.thisWeekDone
                ? 'Отметились 2 из 2 — неделя засчитана'
                : !meDone && !friendDone
                  ? 'На этой неделе пока никто не отметился'
                  : !meDone
                    ? `${friend.name} уже отметился — очередь за тобой`
                    : `${friend.name} пока не отметился`;
          return (
            <Card key={d.id} style={{ gap: 0 }} onPress={() => (d.status === 'pending' ? router.push({ pathname: '/duo/[id]', params: { id: d.id } }) : router.push('/people'))}>
              <Label>МОИ ЛЮДИ · ТЫ + {friend.name.toUpperCase()}</Label>
              <Txt size={24} weight="bold" lh={31} color={colors.black} style={{ marginTop: 8 }}>
                {d.status === 'pending' ? 'Ждём ответ' : s.weeks > 0 ? `${pluralWeeks(s.weeks)} подряд` : 'Первая неделя'}
              </Txt>
              <View style={{ marginTop: 8 }}>
                <CheckLine text={line} color={colors.sun} size={12} />
              </View>
            </Card>
          );
        })}

        {store.companies.map((c) => {
          const s = store.companyStreak(c);
          const need = Math.max(0, s.required - s.activeNow.length);
          return (
            <Card key={c.id} style={{ gap: 0 }} onPress={() => router.push({ pathname: '/company/[id]', params: { id: c.id } })}>
              <Label>КОМПАНИЯ · {c.name.toUpperCase()}</Label>
              <Txt size={24} weight="bold" lh={31} color={colors.black} style={{ marginTop: 8 }}>
                {s.weeks > 0 ? `${pluralWeeks(s.weeks)} подряд` : 'Первая неделя'}
              </Txt>
              <View style={{ marginTop: 8 }}>
                <CheckLine
                  color={colors.sun}
                  text={
                    `Активны ${s.activeNow.length} из ${c.memberIds.length} · ` +
                    (need === 0 ? `достаточно ${NUM_WORDS[s.required] ?? s.required}` : `нужно ещё ${need} ${plural(need, 'человек', 'человека', 'человек')}`)
                  }
                />
              </View>
            </Card>
          );
        })}
      </Screen>
      <TabBar active="people" />
    </View>
  );
}
