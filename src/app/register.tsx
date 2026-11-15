import { useState } from 'react';
import { Button, Field, Txt } from '@/components/ui';
import { AuthForm } from '@/components/AuthForm';
import { useStore } from '@/lib/store';
import { isLoginValid } from '@/lib/supabase';
import { colors } from '@/theme';

// 01 · Регистрация: Никнейм (имя на экранах) / Логин / Пароль / Повтор пароля
export default function Register() {
  const store = useStore();
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const mismatch = !!repeat && password !== repeat;
  const badLogin = !!login && !isLoginValid(login);
  const valid = name.trim() && isLoginValid(login) && password.length >= 6 && password === repeat;

  const submit = async () => {
    setBusy(true);
    setError('');
    const err = await store.register(name, login, password);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <AuthForm>
      <Field placeholder="Никнейм" value={name} onChangeText={setName} autoComplete="nickname" maxLength={32} />
      <Field placeholder="Логин" value={login} onChangeText={setLogin} autoCapitalize="none" autoCorrect={false} autoComplete="username" maxLength={32} />
      <Field placeholder="Пароль" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <Field placeholder="Повтори пароль" value={repeat} onChangeText={setRepeat} secureTextEntry />
      {(mismatch || badLogin || !!error) && (
        <Txt size={12} color={colors.peach} center>
          {error || (badLogin ? 'Логин: латиница, цифры, точка, дефис или _ (от 3 символов).' : 'Пароли не совпадают')}
        </Txt>
      )}
      <Button title={busy ? 'Создаём…' : 'Регистрация'} arrow disabled={!valid || busy} onPress={submit} style={{ marginTop: 10 }} />
      <Txt size={11} center color={colors.gray} style={{ opacity: 0.8 }}>
        Пароль — минимум 6 символов. Логин нужен для входа, никнейм видят друзья.
      </Txt>
    </AuthForm>
  );
}
