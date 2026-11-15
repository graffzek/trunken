import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Label, Screen, Txt } from '@/components/ui';
import { TabBar } from '@/components/TabBar';
import { useCreateFlow } from '@/components/CreateFlow';
import { IncomingInvites, useRefreshOnFocus } from '@/components/Incoming';
import { MY_ID, useStore } from '@/lib/store';
import { plural, pluralWeeks } from '@/lib/streaks';
import { capitalize, joinNames } from '@/lib/format';
import { colors } from '@/theme';

// 04 · Мои люди
export default function People() {
  const router = useRouter();
  const store = useStore();
  const flow = useCreateFlow();
  useRefreshOnFocus();
  const evCount = (spaceId: string) => store.evenings.filter((e) => e.spaceId === spaceId).length;

  return (
    <View style={{ flex: 1 }}>
      <Screen title="Мои люди" centerTitle withTabBar contentTop={82}>
        <IncomingInvites />
        {store.duos.filter((d) => !d.incoming).map((d) => {
          const friend = store.userById(d.friendId);
          if (d.status === 'pending')
            return (
              <Card key={d.id} tone="orange" style={{ gap: 0 }} onPress={() => router.push({ pathname: '/duo/[id]', params: { id: d.id } })}>
                <Label color={colors.sun}>ОДИН НА ОДИН</Label>
                <Txt size={28} weight="bold" lh={36} color={colors.black} style={{ marginTop: 10 }}>
                  Ты + {friend.name}
                </Txt>
                <Txt size={13} weight="medium" color={colors.sun} style={{ marginTop: 10 }}>
                  Ждём, когда {friend.name} примет приглашение.
                </Txt>
              </Card>
            );
          const s = store.duoStreak(d);
          const meDone = s.activeNow.includes(MY_ID);
          const friendDone = s.activeNow.includes(d.friendId);
          const n = evCount(d.id);
          return (
            <Card key={d.id} tone="orange" style={{ gap: 0 }}>
              <Label color={colors.sun}>ОДИН НА ОДИН</Label>
              <Txt size={28} weight="bold" lh={36} color={colors.black} style={{ marginTop: 10 }}>
                Ты + {friend.name}
              </Txt>
              <Txt size={13} weight="medium" lh={17} color={colors.sun} style={{ marginTop: 10 }}>
                {pluralWeeks(s.weeks)} рядом · {n} {plural(n, 'общий вечер', 'общих вечера', 'общих вечеров')}
              </Txt>
              <Txt size={12} lh={16} color={colors.sun} style={{ marginTop: 10 }}>
                {s.thisWeekDone
                  ? 'Вы оба отметились на этой неделе.'
                  : meDone
                    ? `Ты уже отметился. ${friend.name} ещё может добавить свой момент до конца воскресенья.`
                    : friendDone
                      ? `${friend.name} уже отметился. Добавь свой момент до конца воскресенья.`
                      : 'На этой неделе пока тихо. Время есть до конца воскресенья.'}
              </Txt>
              <Button title="Посмотреть прогресс дуо" variant="black" height={48} r={16} size={14} onPress={() => router.push('/streaks')} style={{ marginTop: 10 }} />
            </Card>
          );
        })}

        {store.companies.map((c) => {
          const s = store.companyStreak(c);
          const n = evCount(c.id);
          return (
            <Card key={c.id} style={{ gap: 0 }} onPress={() => router.push({ pathname: '/company/[id]', params: { id: c.id } })}>
              <Label color={colors.graphite}>КОМПАНИЯ</Label>
              <Txt size={28} weight="bold" lh={36} color={colors.black} style={{ marginTop: 12 }}>
                {c.name}
              </Txt>
              <Txt size={13} lh={17} color={colors.graphite} style={{ marginTop: 12 }}>
                {c.memberIds.length} {plural(c.memberIds.length, 'участник', 'участника', 'участников')} · {pluralWeeks(s.weeks)} подряд
              </Txt>
              <Txt size={13} weight="bold" lh={17} color={colors.sun} style={{ marginTop: 12 }}>
                На этой неделе участвуют {s.activeNow.length} из {c.memberIds.length}
                {s.thisWeekDone ? ' ✓' : ''}
              </Txt>
              {s.activeNow.length > 0 && (
                <Txt size={12} lh={16} color={colors.graphite} style={{ marginTop: 12 }}>
                  {capitalize(joinNames(s.activeNow.map((id) => (id === MY_ID ? 'ты' : store.userById(id).name))))} уже{' '}
                  {s.activeNow.length > 1 ? 'добавили свои моменты' : 'добавил свой момент'}. Для продолжения серии достаточно {s.required}.
                </Txt>
              )}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <Button
                  title={`Архив · ${n} ${plural(n, 'вечер', 'вечера', 'вечеров')}`}
                  height={48}
                  r={16}
                  size={14}
                  fg={colors.black}
                  onPress={() => router.push({ pathname: '/archive', params: { space: c.id } })}
                  style={{ flex: 1, paddingHorizontal: 8 }}
                />
                <Button
                  title="Поиграть вместе"
                  height={48}
                  r={16}
                  size={14}
                  fg={colors.black}
                  onPress={() => router.push({ pathname: '/game/who', params: { company: c.id } })}
                  style={{ flex: 1, paddingHorizontal: 8 }}
                />
              </View>
            </Card>
          );
        })}

        {store.duos.length === 0 && store.companies.length === 0 && (
          <Txt size={13} color={colors.muted} center style={{ marginVertical: 30 }}>
            {'Здесь появятся твои дуо и компании.\nПозови первого человека.'}
          </Txt>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button title="Позвать друга" variant="white" height={48} r={16} size={14} onPress={() => flow.open('friend')} style={{ flex: 1 }} />
          <Button title="Новая компания" height={48} r={16} size={14} onPress={() => flow.open('company')} style={{ flex: 1 }} />
        </View>
      </Screen>
      <TabBar active="people" />
      {flow.element}
    </View>
  );
}
