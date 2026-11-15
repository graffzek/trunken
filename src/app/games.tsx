import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Label, Screen, Txt } from '@/components/ui';
import { TabBar } from '@/components/TabBar';
import { useCreateFlow } from '@/components/CreateFlow';
import { useStore } from '@/lib/store';
import { colors } from '@/theme';

/** «Наши люди» → «Нашими людьми» для кнопки «Играть с …» (простое правило для типичных названий). */
function instrumental(name: string) {
  if (name === 'Наши люди') return 'Нашими людьми';
  return name;
}

// 09 · Игры
export default function Games() {
  const router = useRouter();
  const store = useStore();
  const flow = useCreateFlow();
  const company = store.companies[0];

  return (
    <View style={{ flex: 1 }}>
      <Screen title="Игры для своих" withTabBar gap={10} contentTop={16}>
        <Txt size={16} lh={21} color={colors.gray}>
          Повод собраться — уже здесь.
        </Txt>

        <Card tone="orange" style={{ paddingTop: 14, paddingBottom: 14, gap: 0 }}>
          <Label color={colors.black}>ДЛЯ КОМПАНИИ · 3–8 ИГРОКОВ</Label>
          <Txt size={34} weight="extra" lh={44} color={colors.black} style={{ marginTop: 14 }}>
            Кто из нас?
          </Txt>
          <Txt size={16} weight="medium" lh={21} color={colors.black} style={{ marginTop: 14 }}>
            {'У кого всегда есть история,\nкоторая начинается с «однажды»?'}
          </Txt>
          <Txt size={12} lh={16} color={colors.black} style={{ marginTop: 14 }}>
            Один вопрос · пара минут
          </Txt>
          {company ? (
            <Button
              title={`Играть с «${instrumental(company.name)}»`}
              variant="black"
              onPress={() => router.push({ pathname: '/game/who', params: { company: company.id } })}
              style={{ marginTop: 14 }}
            />
          ) : (
            <Button title="Сначала создай компанию" variant="black" onPress={() => flow.open('company')} style={{ marginTop: 14 }} />
          )}
        </Card>

        <Card style={{ paddingTop: 14, paddingBottom: 14, gap: 0 }}>
          <Txt size={19} weight="bold" lh={25} color={colors.black}>
            Или просто вспомните
          </Txt>
          <Txt size={16} weight="bold" lh={21} color={colors.black} style={{ marginTop: 14 }}>
            Ваша общая история
          </Txt>
          <Txt size={13} lh={17} color={colors.mutedOnLight} style={{ marginTop: 14 }}>
            {'Откройте архив, выберите вечер\nи добавьте то, что помните только вы.'}
          </Txt>
          <Button title="Посмотреть воспоминания" fg={colors.sun} onPress={() => router.replace('/archive')} style={{ marginTop: 14 }} />
        </Card>

        <Card tone="orange" style={{ paddingHorizontal: 18, paddingVertical: 14, gap: 8 }}>
          <Txt size={15} weight="bold" lh={19} color={colors.sun}>
            Участие, а не просто вход
          </Txt>
          <Txt size={12} lh={16} color={colors.sun}>
            Ответ или голос в игре поддерживает серию. Просмотр чужих ответов — нет. Алкоголь не нужен и никак не влияет на прогресс.
          </Txt>
        </Card>
      </Screen>
      <TabBar active="games" />
      {flow.element}
    </View>
  );
}
