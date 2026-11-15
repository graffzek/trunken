import { Alert, Image, View } from 'react-native';
import { humanError } from '@/lib/supabase';
import { deleteEvening, setEveningHidden } from '@/lib/moderation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Screen, Txt } from '@/components/ui';
import { MY_ID, useStore } from '@/lib/store';
import { fullDate, joinNames } from '@/lib/format';
import { colors } from '@/theme';

// 06 · Воспоминание / 10 · Новое воспоминание / 13 · Закат у озера
export default function EveningScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const e = store.evenings.find((x) => x.id === id);

  if (!e)
    return (
      <Screen back title="Вечер">
        <Txt color={colors.muted}>Этот вечер не найден.</Txt>
      </Screen>
    );

  const names = e.participantIds.map((p) => (p === MY_ID ? 'Ты' : store.userById(p).name));
  const fresh = Date.now() - new Date(e.date).getTime() < 60 * 60 * 1000;
  const photoH = e.note && e.quote ? 172 : 220;

  return (
    <Screen back title="Тот самый вечер" gap={12}>
      <Txt size={12} weight="medium" lh={16} color={colors.muted}>
        {fullDate(e.date)} · {store.spaceName(e.spaceId)}
      </Txt>
      {e.photoUri ? (
        <Image source={{ uri: e.photoUri }} style={{ width: '100%', height: photoH, borderRadius: 20 }} />
      ) : (
        <View style={{ height: photoH, borderRadius: 20, backgroundColor: colors.placeholder }} />
      )}
      <Txt size={25} weight="bold" lh={32}>
        {e.title}
      </Txt>
      {!!e.note && (
        <Txt size={14} lh={18} color={colors.gray}>
          {e.note}
        </Txt>
      )}

      {e.quote ? (
        <Card tone="orange" style={{ paddingHorizontal: 18, paddingVertical: 18, gap: 8 }}>
          <Txt size={19} weight="bold" lh={25} color={colors.sun}>
            «{e.quote.text}»
          </Txt>
          <Txt size={11} weight="medium" lh={14} color={colors.sun}>
            {e.quote.authorId === MY_ID ? 'Ты' : store.userById(e.quote.authorId).name} · {e.quote.time}
          </Txt>
        </Card>
      ) : (
        fresh &&
        e.spaceId !== 'personal' && (
          <Card tone="orange" style={{ paddingHorizontal: 18, paddingVertical: 18, gap: 8 }}>
            <Txt size={18} weight="bold" lh={23} color={colors.sun}>
              Здесь начинается общая история.
            </Txt>
            <Txt size={12} lh={16} color={colors.sun}>
              Каждый может добавить свой момент позже.
            </Txt>
          </Card>
        )
      )}

      <Card style={{ paddingHorizontal: 16, paddingVertical: 16, gap: 6 }}>
        <Txt size={11} weight="medium" lh={14} color={colors.mutedOnLight}>
          Были рядом
        </Txt>
        <Txt size={15} weight="bold" lh={19} color={colors.black}>
          {joinNames(names)}
        </Txt>
        <Txt size={10} lh={13} color={colors.mutedOnLight}>
          Присутствие не отмечает активность автоматически.
        </Txt>
      </Card>

      <Button title="Вернуться в архив" variant="white" height={48} r={16} size={14} onPress={() => (router.canGoBack() ? router.back() : router.replace('/archive'))} />

      {e.createdBy !== MY_ID && !store.isModerator && (
        <Button
          title="Пожаловаться"
          variant="ghost"
          fg={colors.muted}
          size={13}
          height={40}
          onPress={() =>
            Alert.alert('Пожаловаться на вечер?', 'Модератор посмотрит его и при необходимости скроет.', [
              { text: 'Отмена', style: 'cancel' },
              {
                text: 'Неуместное содержание',
                onPress: () => store.report(e.id, 'Неуместное содержание').then(() => Alert.alert('Спасибо', 'Жалоба отправлена модератору.')).catch((err) => Alert.alert('Ошибка', humanError(err))),
              },
              {
                text: 'Это не мой вечер',
                onPress: () => store.report(e.id, 'Меня отметили без согласия').then(() => Alert.alert('Спасибо', 'Жалоба отправлена модератору.')).catch((err) => Alert.alert('Ошибка', humanError(err))),
              },
            ])
          }
        />
      )}
      {store.isModerator && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            title={e.hidden ? 'Показать' : 'Скрыть (модератор)'}
            variant="white"
            fg={colors.sun}
            height={44}
            size={13}
            style={{ flex: 1 }}
            onPress={() => setEveningHidden(e.id, !e.hidden).then(store.refresh).catch((err) => Alert.alert('Ошибка', humanError(err)))}
          />
          <Button
            title="Удалить"
            variant="black"
            height={44}
            size={13}
            style={{ flex: 1 }}
            onPress={() =>
              Alert.alert('Удалить вечер навсегда?', undefined, [
                { text: 'Отмена', style: 'cancel' },
                {
                  text: 'Удалить',
                  style: 'destructive',
                  onPress: () =>
                    deleteEvening(e.id)
                      .then(store.refresh)
                      .then(() => router.back())
                      .catch((err) => Alert.alert('Ошибка', humanError(err))),
                },
              ])
            }
          />
        </View>
      )}
    </Screen>
  );
}
