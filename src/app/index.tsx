import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronIcon, Screen, SquareStack, Txt } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { TabBar, TabIcon } from '@/components/TabBar';
import { useCreateFlow } from '@/components/CreateFlow';
import { IncomingInvites, useRefreshOnFocus } from '@/components/Incoming';
import { useStore } from '@/lib/store';
import { pluralWeeks } from '@/lib/streaks';
import { dayTitle, withName } from '@/lib/format';
import { colors, gradients } from '@/theme';

// 02 · Главная — все 4 состояния из Figma: не активная / только личная / своё и дуо / все элементы
export default function Home() {
  const router = useRouter();
  const store = useStore();
  const flow = useCreateFlow();
  const personal = store.personalStreak();
  const tiles = [
    ...store.duos.filter((d) => !d.incoming).map((d) => {
      const s = store.duoStreak(d);
      const friend = store.userById(d.friendId);
      return {
        key: d.id,
        count: 2,
        title: `Дуо с ${withName(friend.name)}`,
        sub: d.status === 'pending' ? 'Ждём ответ' : `${weeksShort(s.weeks)} · ${s.activeNow.length} из 2${s.thisWeekDone ? ' ✓' : ''}`,
        go: () => router.push(d.status === 'pending' ? { pathname: '/duo/[id]', params: { id: d.id } } : '/streaks'),
      };
    }),
    ...store.companies.map((c) => {
      const s = store.companyStreak(c);
      return {
        key: c.id,
        count: c.memberIds.length,
        title: c.name,
        sub: `${weeksShort(s.weeks)} · ${s.activeNow.length} из ${c.memberIds.length}${s.thisWeekDone ? ' ✓' : ''}`,
        go: () => router.push({ pathname: '/company/[id]', params: { id: c.id } }),
      };
    }),
  ];
  const empty = !store.personalStarted && tiles.length === 0;
  useRefreshOnFocus();

  const menu = () => {
    if (Platform.OS === 'web') {
      if (store.isModerator) router.push('/moderation');
      else store.logout();
      return;
    }
    Alert.alert(store.me?.name ?? 'Trunken', `@${store.me?.nickname ?? ''}${store.isModerator ? ' · модератор' : ''}`, [
      ...(store.isModerator ? [{ text: 'Модерация', onPress: () => router.push('/moderation') }] : []),
      { text: 'Выйти из аккаунта', onPress: () => store.logout(), style: 'destructive' as const },
      { text: 'Отмена', style: 'cancel' as const },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen withTabBar gap={14}>
        {/* Верхняя панель: «trunken» 28 Bold + знак 22×28 */}
        <View style={styles.top}>
          <Txt size={28} weight="bold" lh={36}>
            trunken
          </Txt>
          <Pressable onPress={menu} hitSlop={12} accessibilityLabel="Профиль: выход и модерация">
            <LogoMark size={28} color={colors.orange} />
          </Pressable>
        </View>

        <View style={{ marginTop: 39 }}>
          <Txt size={29} weight="bold" lh={37}>
            {dayTitle(new Date())}
          </Txt>
          <Txt size={14} lh={17} color={colors.graphite} style={{ marginTop: 1 }}>
            Соберём ещё один хороший вечер?
          </Txt>
        </View>

        <IncomingInvites />

        {empty ? (
          <View style={styles.empty}>
            <Txt size={12} color={colors.graphite} center>
              {'Пока что ничего тут нет\nСкорее исправь это!'}
            </Txt>
            <PlusButton onPress={() => flow.open()} />
          </View>
        ) : (
          <>
            {store.personalStarted && (
              <Pressable onPress={() => router.push('/streaks')} style={styles.big}>
                <View style={styles.bigTop}>
                  <Txt size={13} weight="bold" color={colors.black} lh={17}>
                    ТВОЯ СЕРИЯ
                  </Txt>
                  <FlameIcon />
                </View>
                <View style={styles.bigCenter}>
                  <LogoMark size={46} color={colors.sun} />
                  <Txt size={23} weight="bold" color={colors.black} lh={21} center style={{ marginTop: 5 }}>
                    {personal.weeks > 0 ? `${pluralWeeks(personal.weeks)} вместе с собой` : 'Первая неделя впереди'}
                  </Txt>
                  <Txt size={12} weight="medium" color={colors.black} center style={{ marginTop: 10 }}>
                    {'✓  '}
                    {personal.thisWeekDone
                      ? 'На этой неделе ты уже отметился'
                      : personal.weeks > 0
                        ? 'На этой неделе ты ещё не отметился'
                        : 'Сохрани момент — и неделя засчитается'}
                  </Txt>
                </View>
                <WeekPills weeks={personal.weeks} />
              </Pressable>
            )}

            {tiles.length === 1 ? (
              <Tile count={tiles[0].count} title={tiles[0].title} sub={tiles[0].sub} go={tiles[0].go} wide />
            ) : (
              <View style={styles.grid}>
                {tiles.map((t) => (
                  <Tile key={t.key} count={t.count} title={t.title} sub={t.sub} go={t.go} />
                ))}
              </View>
            )}

            {tiles.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: 22 }}>
                <PlusButton onPress={() => flow.open()} />
              </View>
            )}
          </>
        )}
      </Screen>
      <TabBar active="home" />
      {flow.element}
    </View>
  );
}

const weeksShort = (n: number) => (n > 0 ? pluralWeeks(n) : 'Первая неделя');

function PlusButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="Создать серийчик" style={({ pressed }) => [styles.plus, pressed && { opacity: 0.85 }]}>
      <TabIcon name="plus" color={colors.white} size={22} />
    </Pressable>
  );
}

function FlameIcon() {
  return (
    <Svg width={16} height={20} viewBox="0 0 16 20" fill="none">
      <Path
        d="M8 0C8 0 9 3.5 7 6C5.5 8 2 9.5 1.2 12.5C0.4 15.8 2.8 20 8 20C13.2 20 15.6 16 14.8 12.6C14.2 10 12.2 8.6 11.4 6.8C11 8.6 10 9.8 8.8 10.2C9.8 6.6 8 0 8 0Z"
        fill={colors.black}
      />
    </Svg>
  );
}

/** Плашки недель 44×30 r10: 1 — золото, 2 — серебро, 3+ — оранжевый градиент (обводка #8D2400); будущие — #8D2400. */
function WeekPills({ weeks }: { weeks: number }) {
  const first = Math.max(1, weeks - 2);
  const items = Array.from({ length: 6 }, (_, i) => first + i);
  return (
    <View style={styles.pills}>
      {items.map((n) => {
        const done = n <= weeks;
        if (!done)
          return (
            <View key={n} style={[styles.pill, { backgroundColor: colors.sun }]}>
              <Txt size={10} weight="bold" color={colors.orange} lh={13}>
                {n} нед
              </Txt>
            </View>
          );
        const g = n === 1 ? gradients.gold : n === 2 ? gradients.silver : gradients.orange;
        return (
          <LinearGradient key={n} colors={[...g]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pill, styles.pillDone]}>
            <Txt size={10} weight="bold" color={colors.white} lh={13}>
              {n} нед
            </Txt>
          </LinearGradient>
        );
      })}
    </View>
  );
}

function Tile({ count, title, sub, go, wide }: { count: number; title: string; sub: string; go: () => void; wide?: boolean }) {
  return (
    <Pressable onPress={go} style={({ pressed }) => [styles.tile, wide && { width: '100%', paddingHorizontal: 14 }, pressed && { opacity: 0.92 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <SquareStack count={count} />
        <View style={{ marginTop: 5 }}>
          <ChevronIcon />
        </View>
      </View>
      <Txt size={14} weight="bold" color={colors.black} lh={18} numberOfLines={1} style={{ marginTop: 4 }}>
        {title}
      </Txt>
      <Txt size={12} color={colors.graphite} lh={16} numberOfLines={1} style={{ marginTop: 7 }}>
        {sub}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 50, paddingLeft: 1 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 140 },
  plus: { width: 40, height: 44, borderRadius: 15, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  big: { height: 416, borderRadius: 24, backgroundColor: colors.orange, paddingTop: 20, paddingBottom: 20, paddingHorizontal: 19, justifyContent: 'space-between' },
  bigTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  bigCenter: { alignItems: 'center' },
  pills: { flexDirection: 'row', justifyContent: 'space-between' },
  pill: { width: 44, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pillDone: { borderWidth: 1, borderColor: colors.sun },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  tile: { width: '47.4%', height: 100, borderRadius: 24, backgroundColor: colors.white, paddingHorizontal: 19, paddingVertical: 15 },
});
