import { useMemo, useState } from 'react';
import { Alert, Image, StyleSheet, TextInput, View } from 'react-native';
import { humanError } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Chip, Label, Screen, Txt } from '@/components/ui';
import { MY_ID, useStore } from '@/lib/store';
import { dayMonth, time } from '@/lib/format';
import { colors, fonts } from '@/theme';

// Новый момент — мини-чат: фото + текст + куда сохранить
export default function Moment() {
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const router = useRouter();
  const store = useStore();
  const now = useMemo(() => new Date(), []);

  const spaces = [
    { id: 'personal', name: 'Личное' },
    ...store.duos.filter((d) => d.status === 'active').map((d) => ({ id: d.id, name: store.spaceName(d.id) })),
    ...store.companies.map((c) => ({ id: c.id, name: c.name })),
  ];
  const [spaceId, setSpaceId] = useState(spaces[Math.min(1, spaces.length - 1)].id);
  const [text, setText] = useState('');
  const [asQuote, setAsQuote] = useState(false);

  const [busy, setBusy] = useState(false);
  const save = async () => {
    const t = text.trim();
    const firstLine = t.split('\n')[0];
    setBusy(true);
    try {
      const id = await store.saveEvening({
        title: asQuote || !firstLine ? 'Момент' : firstLine.length > 40 ? firstLine.slice(0, 40) + '…' : firstLine,
        spaceId,
        participantIds: [MY_ID],
        photoUri: uri,
        note: !asQuote && t ? t : undefined,
        quote: asQuote && t ? { text: t, authorId: MY_ID, time: time(now) } : undefined,
      });
      router.replace({ pathname: '/evening-saved', params: { id } });
    } catch (e) {
      Alert.alert('Не сохранилось', humanError(e));
    } finally {
      setBusy(false);
    }
  };

  const counted = spaceId === 'personal' ? 'Засчитается в личную серию.' : `Засчитается в личную серию и в серию «${spaces.find((s) => s.id === spaceId)?.name}».`;

  return (
    <Screen back title="Новый момент">
      <View style={styles.photo}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} />
        ) : (
          <LinearGradient colors={['#474747', '#29201B', '#8D2400']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.stamp}>
          <Txt size={11} weight="bold">
            {dayMonth(now)} · {time(now)}
          </Txt>
        </View>
      </View>

      <Label color={colors.muted}>КУДА СОХРАНИТЬ</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {spaces.map((s) => (
          <Chip key={s.id} title={s.name} active={s.id === spaceId} onPress={() => setSpaceId(s.id)} />
        ))}
      </View>

      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={asQuote ? 'Кто что сказал? Запиши цитату' : 'Что хочется запомнить?'}
          placeholderTextColor={colors.muted}
          multiline
          style={styles.input}
          selectionColor={colors.orange}
        />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Chip tone="light" title="“ Цитата" active={asQuote} onPress={() => setAsQuote((q) => !q)} />
          <Chip
            tone="light"
            title="Карточка вечера"
            onPress={() => router.replace({ pathname: '/save-evening', params: { space: spaceId, ...(uri ? { photo: uri } : {}), ...(text ? { note: text } : {}) } })}
          />
        </View>
      </View>

      <Txt size={12} color={colors.muted}>
        {counted}
      </Txt>
      <Button title={busy ? 'Сохраняем…' : 'Сохранить момент'} onPress={save} disabled={busy || (!uri && !text.trim())} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { height: 280, borderRadius: 24, overflow: 'hidden', justifyContent: 'flex-end', padding: 14, backgroundColor: colors.placeholder },
  stamp: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  composer: { backgroundColor: colors.white, borderRadius: 24, padding: 16, gap: 14 },
  input: { fontFamily: fonts.regular, fontSize: 15, color: colors.black, minHeight: 44, textAlignVertical: 'top' },
});
