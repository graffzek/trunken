import { useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Button, Card, Field, Label, Overlay, Screen, Txt } from '@/components/ui';
import { MY_ID, useStore } from '@/lib/store';
import { plural, pluralWeeks } from '@/lib/streaks';
import { humanError } from '@/lib/supabase';
import { colors } from '@/theme';

const safe = (fn: () => Promise<unknown> | void) => async () => {
  try {
    await fn();
  } catch (e) {
    Alert.alert('Не получилось', humanError(e));
  }
};

function confirm(title: string, message: string, ok: string, onOk: () => Promise<unknown> | void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) safe(onOk)();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Отмена', style: 'cancel' },
    { text: ok, style: 'destructive', onPress: safe(onOk) },
  ]);
}

// Компания · Редактировать
export default function CompanyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const c = store.companies.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(c?.name ?? '');

  if (!c)
    return (
      <Screen back title="Компания">
        <Txt color={colors.muted}>Компания не найдена.</Txt>
      </Screen>
    );

  const s = store.companyStreak(c);
  const evenings = store.evenings.filter((e) => e.spaceId === c.id).length;
  const isOwner = c.ownerId === MY_ID;

  return (
    <Screen back title="Компания">
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Label>НАЗВАНИЕ</Label>
          {isOwner && (
            <Pressable onPress={() => (setName(c.name), setEditing(true))} hitSlop={10}>
              <Txt size={13} weight="bold" color={colors.orange}>
                Изменить
              </Txt>
            </Pressable>
          )}
        </View>
        <Txt size={26} weight="bold" color={colors.black}>
          {c.name}
        </Txt>
        <Txt size={12} color={colors.mutedOnLight}>
          {c.memberIds.length} {plural(c.memberIds.length, 'участник', 'участника', 'участников')} · {pluralWeeks(s.weeks)} подряд · {evenings}{' '}
          {plural(evenings, 'вечер', 'вечера', 'вечеров')}
        </Txt>
      </Card>

      <Card tone="orange">
        <Label color={colors.black}>СЕРИЯ КОМПАНИИ</Label>
        <Txt size={20} weight="bold" color={colors.black}>
          Для продолжения нужно {s.required} из {c.memberIds.length}
        </Txt>
        <Txt size={12} color={colors.black}>
          Минимум 2 участника и не меньше 30% состава. Новые участники учитываются со следующего понедельника.
        </Txt>
      </Card>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt size={15} weight="bold">
          Участники · {c.memberIds.length}
        </Txt>
        <Button small title="+ Пригласить" onPress={() => router.push({ pathname: '/company/[id]/invite', params: { id: c.id } })} />
      </View>

      <Card style={{ gap: 12 }}>
        {c.memberIds.map((m) => {
          const me = m === MY_ID;
          const u = me ? store.me : store.userById(m);
          const active = s.activeNow.includes(m);
          return (
            <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={u?.name ?? 'Я'} size={36} bg={me ? colors.black : undefined} />
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="bold" color={colors.black}>
                  {me ? 'Ты' : u?.name}
                </Txt>
                <Txt size={11} color={colors.mutedOnLight}>
                  {me && isOwner ? 'создатель · ' : ''}
                  {active ? 'на этой неделе ✓' : 'ещё не отметился'}
                </Txt>
              </View>
              {!me && isOwner && (
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    confirm(`Убрать: ${u?.name}?`, 'Воспоминания компании останутся. Участие перестанет учитываться с этого момента.', 'Убрать', () =>
                      store.removeFromCompany(c.id, m),
                    )
                  }
                >
                  <Txt size={12} weight="bold" color={colors.sun}>
                    Убрать
                  </Txt>
                </Pressable>
              )}
            </View>
          );
        })}
      </Card>

      <Button title="Архив компании" variant="white" onPress={() => router.push({ pathname: '/archive', params: { space: c.id } })} />
      <Button
        title={isOwner ? 'Удалить компанию' : 'Покинуть компанию'}
        variant="ghost"
        onPress={() =>
          confirm(
            isOwner ? 'Удалить компанию?' : 'Покинуть компанию?',
            isOwner ? 'Ты создатель: компания и её архив удалятся для всех участников. Это нельзя отменить.' : 'Ты больше не будешь участвовать в серии компании.',
            isOwner ? 'Удалить' : 'Покинуть',
            async () => {
              await store.leaveCompany(c.id);
              router.dismissTo('/people');
            },
          )
        }
      />

      <Overlay visible={editing} onClose={() => setEditing(false)} title="Название">
        <Field dark value={name} onChangeText={setName} autoFocus />
        <Button
          title="Сохранить"
          disabled={!name.trim()}
          onPress={safe(async () => {
            await store.renameCompany(c.id, name);
            setEditing(false);
          })}
        />
        <Button title="Отмена" variant="ghost" fg={colors.black} onPress={() => setEditing(false)} />
      </Overlay>
    </Screen>
  );
}
