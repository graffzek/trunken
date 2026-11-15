import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, View } from 'react-native';
import { Button, Card, Chip, Field, Label, Screen, Txt } from '@/components/ui';
import { deleteEvening, listReports, listUsers, ReportRow, resolveReport, setBanned, setEveningHidden, setRole, UserRow } from '@/lib/moderation';
import { humanError } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { dayMonth } from '@/lib/format';
import { colors } from '@/theme';

type Tab = 'reports' | 'users';

function ask(title: string, ok: string, fn: () => Promise<void>) {
  const run = () => fn().catch((e) => Alert.alert('Не получилось', humanError(e)));
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(title)) run();
    return;
  }
  Alert.alert(title, undefined, [
    { text: 'Отмена', style: 'cancel' },
    { text: ok, style: 'destructive', onPress: run },
  ]);
}

// Модерация — видна только аккаунтам с ролью moderator
export default function Moderation() {
  const store = useStore();
  const [tab, setTab] = useState<Tab>('reports');
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const loadReports = useCallback(() => {
    listReports().then(setReports).catch((e) => setError(e.message));
  }, []);
  const loadUsers = useCallback(() => {
    listUsers(q).then(setUsers).catch((e) => setError(e.message));
  }, [q]);

  useEffect(() => {
    if (tab === 'reports') loadReports();
  }, [tab, loadReports]);
  useEffect(() => {
    if (tab !== 'users') return;
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [tab, loadUsers]);

  return (
    <Screen back title="Модерация" gap={12}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip title="Жалобы" active={tab === 'reports'} onPress={() => setTab('reports')} />
        <Chip title="Пользователи" active={tab === 'users'} onPress={() => setTab('users')} />
      </View>
      {!!error && (
        <Txt size={12} color={colors.peach}>
          {error}
        </Txt>
      )}

      {tab === 'reports' &&
        (reports === null ? (
          <ActivityIndicator color={colors.orange} />
        ) : reports.length === 0 ? (
          <Txt size={13} color={colors.muted}>
            Новых жалоб нет.
          </Txt>
        ) : (
          reports.map((r) => (
            <Card key={r.id} style={{ gap: 6 }}>
              <Label>
                {dayMonth(r.created_at).toUpperCase()} · ОТ @{r.reporter?.nickname ?? '—'}
              </Label>
              <Txt size={15} weight="bold" color={colors.black}>
                {r.evening ? `«${r.evening.title}»${r.evening.hidden ? ' (скрыт)' : ''}` : 'Вечер уже удалён'}
              </Txt>
              <Txt size={13} color={colors.mutedOnLight}>
                {r.reason}
              </Txt>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {r.evening && (
                  <Button
                    small
                    title={r.evening.hidden ? 'Показать' : 'Скрыть'}
                    onPress={() => setEveningHidden(r.evening!.id, !r.evening!.hidden).then(loadReports).catch((e) => Alert.alert('Ошибка', humanError(e)))}
                  />
                )}
                {r.evening && (
                  <Button small variant="black" title="Удалить вечер" onPress={() => ask('Удалить вечер навсегда?', 'Удалить', async () => (await deleteEvening(r.evening!.id), loadReports()))} />
                )}
                <Button small variant="white" fg={colors.sun} title="Закрыть жалобу" onPress={() => resolveReport(r.id).then(loadReports).catch((e) => Alert.alert('Ошибка', humanError(e)))} />
              </View>
            </Card>
          ))
        ))}

      {tab === 'users' && (
        <>
          <Field placeholder="Поиск по нику" value={q} onChangeText={setQ} autoCapitalize="none" autoCorrect={false} />
          {users === null ? (
            <ActivityIndicator color={colors.orange} />
          ) : (
            users.map((u) => {
              const self = u.nickname === store.me?.nickname;
              return (
                <Card key={u.id} style={{ gap: 6 }}>
                  <Label color={u.banned ? colors.sun : colors.mutedOnLight}>
                    {u.role === 'moderator' ? 'МОДЕРАТОР' : 'ПОЛЬЗОВАТЕЛЬ'}
                    {u.banned ? ' · ЗАБЛОКИРОВАН' : ''}
                  </Label>
                  <Txt size={16} weight="bold" color={colors.black}>
                    {u.name} <Txt size={13} color={colors.mutedOnLight}>@{u.nickname}</Txt>
                  </Txt>
                  {!self && (
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      <Button
                        small
                        variant={u.banned ? 'white' : 'black'}
                        title={u.banned ? 'Разблокировать' : 'Заблокировать'}
                        onPress={() => ask(u.banned ? `Разблокировать @${u.nickname}?` : `Заблокировать @${u.nickname}?`, 'Да', async () => (await setBanned(u.id, !u.banned), loadUsers()))}
                      />
                      <Button
                        small
                        variant="white"
                        fg={colors.sun}
                        title={u.role === 'moderator' ? 'Снять модератора' : 'Сделать модератором'}
                        onPress={() => ask(`Изменить роль @${u.nickname}?`, 'Да', async () => (await setRole(u.id, u.role === 'moderator' ? 'user' : 'moderator'), loadUsers()))}
                      />
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </>
      )}
    </Screen>
  );
}
