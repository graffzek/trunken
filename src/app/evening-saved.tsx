import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, CheckLine, Txt } from '@/components/ui';
import { Backdrop } from '@/components/Backdrop';
import { LogoMark } from '@/components/Logo';
import { MY_ID, useStore } from '@/lib/store';
import { weekStart } from '@/lib/streaks';
import { dayMonth } from '@/lib/format';
import { colors } from '@/theme';

// 08 · Вечер сохранён · Dark (фон со стеклом, белый заголовок, оранжевые кнопки)
export default function EveningSaved() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useStore();
  const e = store.evenings.find((x) => x.id === id);

  const monday = weekStart(new Date()).getTime();
  const mineThisWeek = store.activities.filter((a) => a.userId === MY_ID && new Date(a.at).getTime() >= monday);
  const inSpace = mineThisWeek.filter((a) => a.spaceId === e?.spaceId);
  const firstThisWeek = mineThisWeek.length <= 1;
  const where = !e || e.spaceId === 'personal' ? 'В личном архиве' : store.duos.some((d) => d.id === e.spaceId) ? 'В архиве дуо' : 'В архиве компании';

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <Backdrop name="saved" />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View style={{ alignItems: 'center', height: 56, justifyContent: 'center' }}>
          <LogoMark size={42} />
        </View>
        <Txt size={36} weight="bold" lh={47} center>
          {'Этот вечер\nтеперь с вами.'}
        </Txt>
        {e && (
          <Txt size={15} lh={19} color={colors.gray} center style={{ marginTop: 24 }}>
            {e.title}
            {'\n'}
            {dayMonth(e.date)} · {store.spaceName(e.spaceId)}
          </Txt>
        )}
        <Card style={{ marginTop: 24, gap: 12 }}>
          <CheckLine text={`${where} появился новый вечер`} />
          <Txt size={12} lh={16} color={colors.mutedOnLight}>
            {firstThisWeek
              ? 'Это твой первый момент на этой неделе — неделя засчитана.'
              : inSpace.length > 1
                ? 'Твоя активность за неделю уже отмечена.\nЕщё одно действие не добавляет новую неделю.'
                : 'Неделя в этом пространстве засчитана для тебя.'}
          </Txt>
          {e && e.spaceId !== 'personal' && (
            <Txt size={11} lh={14} color={colors.mutedOnLight}>
              Другие участники отмечаются самостоятельно.
            </Txt>
          )}
        </Card>
        <View style={{ gap: 24, marginTop: 24 }}>
          <Button title="Открыть воспоминание" onPress={() => e && router.replace({ pathname: '/evening/[id]', params: { id: e.id } })} />
          <Button title="Вернуться на главную" onPress={() => router.dismissTo('/')} />
        </View>
      </View>
    </View>
  );
}
