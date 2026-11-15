import { useCallback } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useStore } from '@/lib/store';
import { colors } from '@/theme';
import { Card, Label, Txt } from './ui';

/** Входящие приглашения в дуо — показываются на главной и в «Моих людях». */
export function IncomingInvites() {
  const router = useRouter();
  const store = useStore();
  const incoming = store.duos.filter((d) => d.incoming);
  if (!incoming.length) return null;
  return (
    <View style={{ gap: 10 }}>
      {incoming.map((d) => {
        const f = store.userById(d.friendId);
        return (
          <Card key={d.id} tone="white" onPress={() => router.push({ pathname: '/duo/[id]', params: { id: d.id } })} style={{ gap: 4, borderWidth: 2, borderColor: colors.orange }}>
            <Label color={colors.sun}>НОВОЕ ПРИГЛАШЕНИЕ</Label>
            <Txt size={17} weight="bold" color={colors.black}>
              {f.name} зовёт тебя в дуо
            </Txt>
            <Txt size={12} color={colors.mutedOnLight}>
              Нажми, чтобы принять или отклонить.
            </Txt>
          </Card>
        );
      })}
    </View>
  );
}

/** Подтягивает свежие данные из базы, когда экран открывается. */
export function useRefreshOnFocus() {
  const { refresh } = useStore();
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
}
