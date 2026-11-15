import { useRouter } from 'expo-router';
import { Button, Card, Screen, Txt } from '@/components/ui';
import { colors } from '@/theme';

// 12 · Ответ сохранён
export default function Answered() {
  const router = useRouter();
  return (
    <Screen title="Момент принят" titleSize={25} gap={18} contentTop={42}>
      <Card tone="orange" style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 0 }}>
        <Txt size={58} weight="bold" lh={75} color={colors.black}>
          ✓
        </Txt>
        <Txt size={29} weight="bold" lh={38} color={colors.black} style={{ marginTop: 18 }}>
          {'Хорошая история\nобязательно найдётся.'}
        </Txt>
        <Txt size={17} weight="bold" lh={22} color={colors.sun} style={{ marginTop: 18 }}>
          Твой голос сохранён
        </Txt>
        <Txt size={13} lh={17} color={colors.sun} style={{ marginTop: 18 }}>
          Голос сохранён в игре компании.
        </Txt>
      </Card>
      <Card style={{ gap: 10 }}>
        <Txt size={19} weight="bold" lh={25} color={colors.black}>
          Твоё участие отмечено
        </Txt>
        <Txt size={13} lh={17} color={colors.mutedOnLight}>
          {'Голос поддерживает твою личную серию\nи серию компании. Несколько действий\nне добавляют лишних недель.'}
        </Txt>
        <Txt size={12} lh={16} color={colors.mutedOnLight}>
          Ответы других появятся, когда они проголосуют.
        </Txt>
      </Card>
      <Button title="Вернуться к играм" variant="white" height={54} onPress={() => router.dismissTo('/games')} />
      <Button title="Посмотреть серийчики" fg={colors.sun} height={54} onPress={() => router.replace('/streaks')} />
    </Screen>
  );
}
