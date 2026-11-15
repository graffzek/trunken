import { useState } from 'react';
import { Alert, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Button, Card, CheckLine, Label, Screen, Txt } from '@/components/ui';
import { useStore } from '@/lib/store';
import { humanError } from '@/lib/supabase';
import { colors } from '@/theme';

// Дуо · приглашение: у пригласившего — «Ждём …», у приглашённого — «Принять / Отклонить»
export default function DuoInvite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const duo = store.duos.find((d) => d.id === id);
  const [busy, setBusy] = useState(false);

  if (!duo)
    return (
      <Screen back title="Дуо">
        <Txt color={colors.muted}>Приглашение не найдено или уже отменено.</Txt>
      </Screen>
    );

  const friend = store.userById(duo.friendId);
  const act = async (fn: () => Promise<void>, then: () => void) => {
    setBusy(true);
    try {
      await fn();
      then();
    } catch (e) {
      Alert.alert('Не получилось', humanError(e));
    } finally {
      setBusy(false);
    }
  };

  if (duo.incoming)
    return (
      <Screen back contentStyle={{ paddingTop: 60 }}>
        <Card tone="orange" style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row' }}>
            <Avatar name={friend.name} size={56} bg={colors.peach} />
            <View style={{ marginLeft: -10 }}>
              <Avatar name={store.me?.name ?? 'Я'} size={56} bg={colors.black} />
            </View>
          </View>
          <Label color={colors.black}>ДУО · ПРИГЛАШЕНИЕ</Label>
          <Txt size={29} weight="bold" lh={36} color={colors.black}>
            {friend.name} зовёт тебя в дуо
          </Txt>
          <Txt size={13} color={colors.black}>
            Общий архив и общая серия: неделя засчитывается, когда отметились вы оба.
          </Txt>
        </Card>
        <Button
          title={busy ? 'Секунду…' : 'Принять'}
          disabled={busy}
          onPress={() => act(() => store.acceptDuo(duo.id), () => router.replace({ pathname: '/opened', params: { kind: 'duo' } }))}
        />
        <Button title="Отклонить" variant="ghost" disabled={busy} onPress={() => act(() => store.declineDuo(duo.id), () => router.back())} />
      </Screen>
    );

  return (
    <Screen back contentStyle={{ paddingTop: 60 }}>
      <Card tone="orange" style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row' }}>
          <Avatar name={store.me?.name ?? 'Я'} size={56} bg={colors.black} />
          <View style={{ marginLeft: -10 }}>
            <Avatar name={friend.name} size={56} bg={colors.peach} />
          </View>
        </View>
        <Label color={colors.black}>ДУО · ПРИГЛАШЕНИЕ</Label>
        <Txt size={29} weight="bold" lh={36} color={colors.black}>
          {duo.status === 'active' ? `Ты + ${friend.name}` : `Ждём: ${friend.name}`}
        </Txt>
        <Txt size={13} color={colors.black}>
          {duo.status === 'active'
            ? 'Дуо-серия идёт. Неделя засчитывается, когда отметились оба.'
            : `Как только ${friend.name} примет приглашение в своём Trunken, начнётся ваша дуо-серия.`}
        </Txt>
        <CheckLine text="Приглашение отправлено" />
      </Card>
      <Card>
        <Label>ИЛИ НАПОМНИ ДРУГУ</Label>
        <Txt size={14} color={colors.black}>
          Приглашение появится у @{friend.nickname} на экране «Мои люди».
        </Txt>
      </Card>
      <Button
        title="Написать другу"
        variant="white"
        onPress={() => Share.share({ message: `Я позвал тебя в дуо в Trunken — загляни в «Мои люди». Мой ник: @${store.me?.nickname ?? ''}` }).catch(() => {})}
      />
      <Button title="Готово" onPress={() => router.dismissTo('/')} />
      {duo.status === 'pending' && (
        <Button title="Отменить приглашение" variant="ghost" disabled={busy} onPress={() => act(() => store.declineDuo(duo.id), () => router.dismissTo('/'))} />
      )}
    </Screen>
  );
}
