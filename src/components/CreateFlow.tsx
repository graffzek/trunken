import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme';
import { useStore, User } from '@/lib/store';
import { humanError } from '@/lib/supabase';
import { Avatar, Button, CheckIcon, Field, Label, Overlay, Txt } from './ui';

type Step = 'menu' | 'friend' | 'company';

const COVER_COLORS = [colors.orange, colors.peach, colors.sun, colors.black, '#CF9324'];

/**
 * Оверлеи между «создать» и появлением серии:
 * «Серийчик» (Frame 15) → «Пригласить друга» / «Новая компания».
 * Один Modal с меняющимся содержимым — так iOS не спотыкается о смену модалок.
 */
export function useCreateFlow() {
  const [step, setStep] = useState<Step | null>(null);
  const close = () => setStep(null);
  const element = <CreateFlowOverlay step={step} setStep={setStep} close={close} />;
  return { open: (s: Step = 'menu') => setStep(s), element };
}

function CreateFlowOverlay({ step, setStep, close }: { step: Step | null; setStep: (s: Step) => void; close: () => void }) {
  const router = useRouter();
  const store = useStore();
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [name, setName] = useState('Наши люди');
  const [color, setColor] = useState<string>(colors.orange);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Поиск людей по никнейму в базе (с небольшой задержкой)
  useEffect(() => {
    if (step !== 'friend' || query.trim().length < 2) return setFound([]);
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
  }, [query, step]);

  const titles: Record<Step, [string, string | undefined]> = {
    menu: ['Серийчик', undefined],
    friend: ['Пригласить друга', 'Дуо-серия начнётся, когда друг примет приглашение. Общий архив появится сразу.'],
    company: ['Новая компания', 'Общее пространство для вашей компании: архив вечеров, игры и общая серия.'],
  };
  const [title, subtitle] = titles[step ?? 'menu'];

  const inDuo = new Set(store.duos.map((d) => d.friendId));
  const q = query.trim().toLowerCase().replace(/^@/, '');
  const known = store.friends.filter((f) => !q || f.name.toLowerCase().includes(q) || f.nickname.includes(q));
  const list = [...known, ...found.filter((f) => !known.some((k) => k.id === f.id))].filter((f) => !inDuo.has(f.id));

  const finish = () => {
    close();
    setQuery('');
    setError('');
  };
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay visible={step !== null} onClose={finish} title={title} subtitle={subtitle}>
      {step === 'menu' && (
        <View style={{ gap: 10, marginTop: 4 }}>
          <Button
            title="Собственная серия"
            onPress={() => {
              store.startPersonal();
              finish();
              router.push({ pathname: '/opened', params: { kind: 'personal' } });
            }}
          />
          <Button title="С другом" onPress={() => setStep('friend')} />
          <Button title="Группа" onPress={() => setStep('company')} />
        </View>
      )}

      {step === 'friend' && (
        <>
          <Field dark placeholder="Ник или имя в Trunken" value={query} onChangeText={setQuery} autoCapitalize="none" autoCorrect={false} />
          <Label>{q.length >= 2 ? 'НАЙДЕНО' : 'ДРУЗЬЯ ИЗ ТВОИХ КОМПАНИЙ'}</Label>
          <View style={{ gap: 10, minHeight: 40 }}>
            {list.slice(0, 5).map((f) => (
              <View key={f.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name={f.name} />
                <View style={{ flex: 1 }}>
                  <Txt size={15} weight="bold" color={colors.black}>
                    {f.name}
                  </Txt>
                  <Txt size={12} color={colors.mutedOnLight}>
                    @{f.nickname}
                  </Txt>
                </View>
                <Button
                  small
                  title="Позвать"
                  disabled={busy}
                  onPress={() =>
                    run(async () => {
                      const id = await store.inviteFriend(f.id);
                      finish();
                      router.push({ pathname: '/duo/[id]', params: { id } });
                    })
                  }
                />
              </View>
            ))}
            {searching && <ActivityIndicator color={colors.orange} />}
            {!searching && list.length === 0 && (
              <Txt size={13} color={colors.mutedOnLight} center>
                {q.length >= 2 ? 'Никого не нашли. Проверь ник или отправь ссылку на приложение.' : 'Введи ник друга — он должен быть зарегистрирован в Trunken.'}
              </Txt>
            )}
          </View>
          {!!error && (
            <Txt size={12} color={colors.sun} center>
              {error}
            </Txt>
          )}
          <Button
            title="Поделиться приложением"
            onPress={() => Share.share({ message: 'Давай вести дуо-серию в Trunken! Мой ник: @' + (store.me?.nickname ?? '') }).catch(() => {})}
          />
          <Button title="Отмена" variant="ghost" fg={colors.black} onPress={finish} />
        </>
      )}

      {step === 'company' && (
        <>
          <Label>НАЗВАНИЕ</Label>
          <Field dark value={name} onChangeText={setName} placeholder="Например, Наши люди" maxLength={60} />
          <Label>ЦВЕТ ОБЛОЖКИ</Label>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {COVER_COLORS.map((c) => (
              <Pressable
                key={c}
                accessibilityLabel="Цвет обложки"
                onPress={() => setColor(c)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: c,
                  borderWidth: color === c ? 3 : 0,
                  borderColor: color === c && c === colors.black ? colors.orange : colors.black,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {color === c && <CheckIcon color={c === colors.peach ? colors.black : colors.white} size={16} />}
              </Pressable>
            ))}
          </View>
          <View style={{ backgroundColor: colors.field, borderRadius: 18, padding: 14 }}>
            <Txt size={12} color={colors.mutedOnLight}>
              Серия компании продолжается, когда за неделю активны минимум 2 участника и не меньше 30% состава.
            </Txt>
          </View>
          {!!error && (
            <Txt size={12} color={colors.sun} center>
              {error}
            </Txt>
          )}
          <Button
            title={busy ? 'Создаём…' : 'Далее · позвать людей'}
            disabled={!name.trim() || busy}
            onPress={() =>
              run(async () => {
                const id = await store.createCompany(name, color);
                finish();
                router.push({ pathname: '/company/[id]/invite', params: { id, mode: 'create' } });
              })
            }
          />
          <Button title="Отмена" variant="ghost" fg={colors.black} onPress={finish} />
        </>
      )}
    </Overlay>
  );
}
