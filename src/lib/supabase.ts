import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Публичные данные проекта: URL и publishable-ключ можно хранить в приложении —
// доступ к данным ограничивают правила RLS из supabase/schema.sql.
export const SUPABASE_URL = 'https://lcaolkgwhnvlroqtqsxa.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_VubnbXLFTU3_F8K5UJOh5g_6ejknj3A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Обновляем токен, только пока приложение на экране.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Вход по логину: Supabase требует почту, поэтому логин превращается в служебный адрес. */
export const loginToEmail = (login: string) => `${login.trim().toLowerCase()}@trunken.app`;

export const isLoginValid = (login: string) => /^[a-z0-9._-]{3,32}$/i.test(login.trim());

/** Перевод частых ошибок Supabase на русский. */
export function humanError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/Invalid login credentials/i.test(msg)) return 'Неверный логин или пароль.';
  if (/already registered|already exists|duplicate key.*nickname/i.test(msg)) return 'Такой логин уже занят.';
  if (/Email not confirmed/i.test(msg)) return 'Аккаунт ещё не подтверждён. В Supabase нужно выключить подтверждение почты.';
  if (/Password should be at least/i.test(msg)) return 'Пароль слишком короткий — нужно минимум 6 символов.';
  if (/Network request failed|Failed to fetch/i.test(msg)) return 'Нет связи с сервером. Проверь интернет.';
  if (/rate limit/i.test(msg)) return 'Слишком много попыток. Подожди минуту.';
  return msg;
}
