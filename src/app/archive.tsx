import { Fragment, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Screen, Txt } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { TabBar } from '@/components/TabBar';
import { Evening, useStore } from '@/lib/store';
import { plural } from '@/lib/streaks';
import { dayMonth } from '@/lib/format';
import { colors } from '@/theme';

// 05 · Архив вечеров
export default function Archive() {
  const router = useRouter();
  const store = useStore();
  const params = useLocalSearchParams<{ space?: string }>();
  const [space, setSpace] = useState<string>(params.space ?? 'all');

  const spaces = [
    { id: 'all', name: 'Все' },
    { id: 'personal', name: 'Личное' },
    ...store.duos.filter((d) => d.status === 'active').map((d) => ({ id: d.id, name: store.spaceName(d.id) })),
    ...store.companies.map((c) => ({ id: c.id, name: c.name })),
  ];
  const list = store.evenings.filter((e) => space === 'all' || e.spaceId === space).sort((a, b) => b.date.localeCompare(a.date));
  const label = space === 'all' ? 'Все пространства' : store.spaceName(space);

  return (
    <View style={{ flex: 1 }}>
      <Screen title="Архив вечеров" withTabBar gap={14}>
        {/* Оранжевая плашка выбора пространства: «Наши люди  /  Архив компании» */}
        <View style={styles.selector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}>
            {spaces.map((s, i) => (
              <Fragment key={s.id}>
                {i > 0 && (
                  <Txt size={13} weight="bold" color={colors.sun}>
                    {'  /  '}
                  </Txt>
                )}
                <Pressable onPress={() => setSpace(s.id)} hitSlop={8}>
                  <Txt size={13} weight="bold" color={s.id === space ? colors.black : colors.sun}>
                    {s.name}
                  </Txt>
                </Pressable>
              </Fragment>
            ))}
          </ScrollView>
        </View>

        <View>
          <Txt size={24} weight="bold" lh={31}>
            {list.length} {plural(list.length, 'сохранённый вечер', 'сохранённых вечера', 'сохранённых вечеров')}
          </Txt>
          <Txt size={12} lh={16} color={colors.muted} style={{ marginTop: 14 }}>
            {label} · моменты остаются навсегда
          </Txt>
        </View>

        {list.length === 0 ? (
          <Card tone="dark" style={{ alignItems: 'center', paddingVertical: 32, gap: 10 }}>
            <LogoMark size={30} color={colors.orange} />
            <Txt size={14} center>
              {'Здесь пока пусто.\nПервый вечер — самый важный.'}
            </Txt>
          </Card>
        ) : (
          list.map((e, i) => (
            <EveningRow key={e.id} e={e} big={i === 0} space={store.spaceName(e.spaceId)} onPress={() => router.push({ pathname: '/evening/[id]', params: { id: e.id } })} />
          ))
        )}

        <Button
          title="+ Сохранить вечер"
          variant="ghost"
          onPress={() => router.push({ pathname: '/save-evening', params: space !== 'all' ? { space } : {} })}
        />
      </Screen>
      <TabBar active="archive" />
    </View>
  );
}

function EveningRow({ e, big, space, onPress }: { e: Evening; big: boolean; space: string; onPress: () => void }) {
  const cover = e.photoUri ? { uri: e.photoUri } : null;
  if (big)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.big, pressed && { opacity: 0.92 }]}>
        {cover ? <Image source={cover} style={styles.bigCover} /> : <View style={[styles.bigCover, { backgroundColor: '#C4C4C4' }]} />}
        <View style={{ flex: 1, paddingLeft: 17, paddingRight: 14, paddingVertical: 18, justifyContent: 'space-between' }}>
          <View style={{ gap: 13 }}>
            <Txt size={10} weight="bold" lh={13} color={colors.sun}>
              {dayMonth(e.date).toUpperCase()}
            </Txt>
            <Txt size={19} weight="bold" lh={25} color={colors.black} numberOfLines={2}>
              {e.title}
            </Txt>
          </View>
          <Txt size={11} lh={14} color={colors.mutedOnLight}>
            {space}
            {'\n'}
            {e.participantIds.length} {plural(e.participantIds.length, 'участник', 'участника', 'участников')}
            {e.photoUri ? ' · фото' : ''}
            {e.quote ? ' · цитаты' : ''}
          </Txt>
        </View>
      </Pressable>
    );
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}>
      {cover ? <Image source={cover} style={styles.thumb} /> : <View style={[styles.thumb, { backgroundColor: '#C4C4C4' }]} />}
      <View style={{ flex: 1, paddingLeft: 16, paddingRight: 12, justifyContent: 'center', gap: 8 }}>
        <Txt size={17} weight="bold" lh={22} color={colors.black} numberOfLines={1}>
          {e.title}
        </Txt>
        <Txt size={12} lh={16} color={colors.mutedOnLight} numberOfLines={1}>
          {dayMonth(e.date)} · {space}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  selector: { height: 44, borderRadius: 16, backgroundColor: colors.orange, justifyContent: 'center' },
  big: { height: 170, flexDirection: 'row', backgroundColor: colors.white, borderRadius: 22, overflow: 'hidden' },
  bigCover: { width: 146, height: '100%' },
  row: { height: 94, flexDirection: 'row', backgroundColor: colors.white, borderRadius: 22, overflow: 'hidden' },
  thumb: { width: 94, height: 94, borderRadius: 20 },
});
