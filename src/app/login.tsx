import { useState } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Field, Txt } from '@/components/ui';
import { AuthForm } from '@/components/AuthForm';
import { useStore } from '@/lib/store';
import { colors } from '@/theme';

// 01 · Войти
export default function Login() {
  const router = useRouter();
  const store = useStore();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError('');
    const err = await store.login(login, password);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <AuthForm>
      <Field placeholder="Логин" value={login} onChangeText={setLogin} autoCapitalize="none" autoCorrect={false} autoComplete="username" />
      <Field placeholder="Пароль" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" onSubmitEditing={submit} />
      {!!error && (
        <Txt size={12} color={colors.peach} center>
          {error}
        </Txt>
      )}
      <Button title={busy ? 'Входим…' : 'Войти'} arrow onPress={submit} disabled={busy || !login || !password} style={{ marginTop: 10 }} />
      <Pressable onPress={() => router.push('/register')} style={{ alignSelf: 'center' }} hitSlop={10}>
        <Txt size={16} lh={21} color={colors.gray}>
          Регистрация
        </Txt>
      </Pressable>
    </AuthForm>
  );
}
