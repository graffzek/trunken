import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Label, Screen, Txt } from '@/components/ui';
import { MY_ID, useStore } from '@/lib/store';
import { joinNames } from '@/lib/format';
import { colors } from '@/theme';

const QUESTIONS = [
  '…всегда знает\nисторию на\n«а помните»?',
  '…первым скажет\n«ещё одну\nисторию»?',
  '…опоздает, но\nс лучшим\nоправданием?',
  '…помнит, кто\nчто заказывал\nв прошлый раз?',
  '…уснёт первым\nна ночёвке?',
  '…знает место,\nо котором никто\nне слышал?',
];

// 11 · Кто из нас
export default function WhoOfUs() {
  const { company } = useLocalSearchParams<{ company: string }>();
  const router = useRouter();
  const store = useStore();
  const c = store.companies.find((x) => x.id === company) ?? store.companies[0];
  const question = useMemo(() => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)], []);

  if (!c)
    return (
      <Screen back title="Кто из нас?">
        <Txt color={colors.muted}>Для игры нужна компания.</Txt>
      </Screen>
    );

  const players = c.memberIds.slice(0, 8);
  const vote = () => {
    // Голос пишется в базу в фоне — экран «Момент принят» открывается сразу.
    store.recordActivity(c.id, 'vote').catch(() => {});
    router.replace({ pathname: '/game/answered', params: { company: c.id } });
  };

  return (
    <Screen title="Кто из нас?" titleSize={25} gap={18} contentTop={42}>
      <Txt size={13} weight="medium" lh={17} color={colors.gray}>
        {c.name} · один вопрос для всех
      </Txt>
      <Card tone="orange" style={{ padding: 22, gap: 0 }}>
        <Label color={colors.black}>КТО ИЗ НАС…</Label>
        <Txt size={33} weight="bold" lh={43} color={colors.black} style={{ marginTop: 16 }}>
          {question}
        </Txt>
        <Txt size={13} lh={17} color={colors.black} style={{ marginTop: 16 }}>
          {'Выбери человека. Твой голос сохранится\nкак участие в игре компании.'}
        </Txt>
      </Card>
      <View style={{ gap: 12 }}>
        {players.map((id) => (
          <Pressable
            key={id}
            onPress={vote}
            style={({ pressed }) => ({ height: 54, borderRadius: 18, backgroundColor: pressed ? colors.peach : colors.white, alignItems: 'center', justifyContent: 'center' })}
          >
            <Txt size={15} weight="bold" color={colors.black}>
              {id === MY_ID ? 'Я' : store.userById(id).name}
            </Txt>
          </Pressable>
        ))}
      </View>
      <Txt size={12} lh={16} color={colors.muted}>
        В этом раунде: {joinNames(players.map((id) => (id === MY_ID ? 'ты' : store.userById(id).name)))}.
      </Txt>
      <Button title="Выйти из игры" variant="ghost" height={54} onPress={() => router.back()} style={{ marginTop: -4 }} />
    </Screen>
  );
}
