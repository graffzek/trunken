import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Button, Card, CheckIcon, Field, Label, Screen, Txt } from '@/components/ui';
import { useStore, User } from '@/lib/store';
import { plural } from '@/lib/streaks';
import { humanError } from '@/lib/supabase';
import { colors } from '@/theme';

// Компания · Позвать людей (при создании и из редактирования)
export default function InviteToCompany() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: 'create' }>();
  const router = useRouter();
  const store = useStore();
  const c = store.companies.find((x) => x.id === id);
  const [picked, setPicked] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) return setFound([]);
    setSearching(true);
    const t = setTimeout(() => {
      store
        .searchUsers(query)
        .then(setFound)
        .catch(() => setFound([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  if (!c)
    return (
      <Screen back title="Позвать в компанию">
        <Txt color={colors.muted}>Компания не найдена.</Txt>
      </Screen>
    );

  const inside = new Set(c.memberIds);
  const base = query.trim().length >= 2 ? found : store.friends;
  const candidates = [...picked, ...base.filter((f) => !picked.some((p) => p.id === f.id))].filter((f) => !inside.has(f.id));
  const toggle = (u: User) => setPicked((p) => (p.some((x) => x.id === u.id) ? p.filter((x) => x.id !== u.id) : [...p, u]));

  const done = async () => {
    setBusy(true);
    try {
      await store.addToCompany(c.id, picked.map((p) => p.id));
      if (mode === 'create') router.replace({ pathname: '/opened', params: { kind: 'company', id: c.id } });
      else router.back();
    } catch (e) {
      Alert.alert('Не получилось', humanError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen back title="Позвать в компанию">
      <Txt size={12} color={colors.muted}>
        {c.name} · {c.memberIds.length === 1 ? 'пока только ты' : `${c.memberIds.length} ${plural(c.memberIds.length, 'участник', 'участника', 'участников')}`}
      </Txt>

      <Field placeholder="Найти по нику" value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} />

      <Txt size={10} weight="bold" color={colors.muted}>
        {query.trim().length >= 2 ? 'НАЙДЕНО' : 'ТВОИ ЛЮДИ В TRUNKEN'}
      </Txt>
      <Card style={{ gap: 12 }}>
        {searching && <ActivityIndicator color={colors.orange} />}
        {!searching && candidates.length === 0 && (
          <Txt size={13} color={colors.mutedOnLight}>
            {query.trim().length >= 2 ? 'Никого не нашли.' : 'Найди друзей по нику — они должны быть зарегистрированы в Trunken.'}
          </Txt>
        )}
        {candidates.map((f) => {
          const on = picked.some((p) => p.id === f.id);
          return (
            <Pressable key={f.id} onPress={() => toggle(f)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
              <Avatar name={f.name} size={36} />
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="bold" color={colors.black}>
                  {f.name}
                </Txt>
                <Txt size={11} color={colors.mutedOnLight}>
                  @{f.nickname}
                </Txt>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: on ? colors.orange : 'transparent',
                  borderWidth: on ? 0 : 2,
                  borderColor: colors.gray,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {on && <CheckIcon color={colors.white} />}
              </View>
            </Pressable>
          );
        })}
      </Card>

      <Card>
        <Label>ДРУГА ЕЩЁ НЕТ В TRUNKEN?</Label>
        <Button
          small
          title="Отправить приглашение"
          onPress={() => Share.share({ message: `Присоединяйся к «${c.name}» в Trunken! Найди меня по нику @${store.me?.nickname ?? ''}` }).catch(() => {})}
          style={{ marginTop: 6, alignSelf: 'flex-start' }}
        />
      </Card>

      <Button
        title={busy ? 'Секунду…' : picked.length ? `Пригласить · ${picked.length}` : mode === 'create' ? 'Позову позже' : 'Выбери людей'}
        disabled={busy || (!picked.length && mode !== 'create')}
        onPress={done}
      />
    </Screen>
  );
}
