import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { humanError } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Chip, Label, Screen, Txt } from '@/components/ui';
import { MY_ID, useStore } from '@/lib/store';
import { fullDate, joinNames } from '@/lib/format';
import { colors, fonts } from '@/theme';

// 07 · Сохранить вечер
export default function SaveEvening() {
  const router = useRouter();
  const store = useStore();
  const params = useLocalSearchParams<{ space?: string; photo?: string; note?: string }>();

  const spaces = useMemo(
    () => [
      { id: 'personal', name: 'Личное', members: [MY_ID] },
      ...store.duos.filter((d) => d.status === 'active').map((d) => ({ id: d.id, name: store.spaceName(d.id), members: [MY_ID, d.friendId] })),
      ...store.companies.map((c) => ({ id: c.id, name: c.name, members: c.memberIds })),
    ],
    [store],
  );
  const [spaceId, setSpaceId] = useState(params.space && spaces.some((s) => s.id === params.space) ? params.space : spaces[spaces.length - 1].id);
  const space = spaces.find((s) => s.id === spaceId) ?? spaces[0];
  const [title, setTitle] = useState('');
  const [note, setNote] = useState(params.note ?? '');
  const [photo, setPhoto] = useState<string | undefined>(params.photo);
  const [picked, setPicked] = useState<string[]>(space.members);

  const cycleSpace = () => {
    const i = spaces.findIndex((s) => s.id === spaceId);
    const next = spaces[(i + 1) % spaces.length];
    setSpaceId(next.id);
    setPicked(next.members);
  };
  const toggle = (id: string) => id !== MY_ID && setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const nameOf = (id: string) => (id === MY_ID ? 'ты' : store.userById(id).name);

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [4, 3] });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const id = await store.saveEvening({ title: title.trim() || 'Хороший вечер', spaceId, participantIds: picked, photoUri: photo, note: note.trim() || undefined });
      router.replace({ pathname: '/evening-saved', params: { id } });
    } catch (e) {
      Alert.alert('Не сохранилось', humanError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen back title="Сохранить вечер" gap={16}>
      <View style={{ gap: 5 }}>
        <Txt size={15} weight="medium" lh={19}>
          Маленький момент. Большая история.
        </Txt>
        <Txt size={12} lh={16} color={colors.muted}>
          Можно сохранить вечер без фото и компании.
        </Txt>
      </View>

      <Card style={{ paddingHorizontal: 16, paddingVertical: 16, gap: 6 }}>
        <Label>НАЗВАНИЕ</Label>
        <TextInput value={title} onChangeText={setTitle} placeholder="Пятничные посиделки" placeholderTextColor={colors.gray} style={styles.title} selectionColor={colors.orange} />
      </Card>

      <Pressable onPress={cycleSpace} style={styles.meta} accessibilityLabel="Сменить, куда сохранить">
        <View style={{ flex: 1, gap: 7 }}>
          <Label>ДАТА</Label>
          <Txt size={14} weight="medium" lh={18} color={colors.black}>
            {fullDate(new Date())}
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 7 }}>
          <Label>СОХРАНИТЬ В</Label>
          <Txt size={14} weight="bold" lh={18} color={colors.sun} numberOfLines={1}>
            {space.name} ↻
          </Txt>
        </View>
      </Pressable>

      <Pressable onPress={pickPhoto} style={styles.photo} accessibilityLabel="Добавить фото">
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} />
        ) : (
          <Txt size={13} weight="medium" color={colors.muted}>
            + Добавить фото
          </Txt>
        )}
      </Pressable>

      <Card style={{ paddingHorizontal: 16, paddingVertical: 16, gap: 6 }}>
        <Label>ЧТО ХОЧЕТСЯ ЗАПОМНИТЬ</Label>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Собрались без повода. Заказали пиццу, смеялись и забыли посмотреть на часы."
          placeholderTextColor={colors.gray}
          style={styles.note}
          selectionColor={colors.orange}
        />
      </Card>

      {space.members.length > 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {space.members.map((m) => (
            <Chip key={m} title={m === MY_ID ? 'Ты' : store.userById(m).name} active={picked.includes(m)} onPress={() => toggle(m)} />
          ))}
        </View>
      )}
      <Txt size={12} lh={16} color={colors.muted}>
        Участники: {joinNames(picked.map(nameOf))}
        {'\n'}Каждый подтверждает свою активность сам.
      </Txt>

      <Button title={busy ? 'Сохраняем…' : 'Сохранить воспоминание'} fg={colors.black} disabled={busy} onPress={save} />
      <Txt size={11} lh={14} color={colors.muted} center style={{ marginTop: -4 }}>
        Воспоминания останутся, даже если серия прервётся.
      </Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.black, padding: 0 },
  note: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 18, color: colors.black, padding: 0, minHeight: 36 },
  meta: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, height: 70 },
  photo: { height: 154, borderRadius: 18, backgroundColor: colors.placeholder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
