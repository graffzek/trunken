import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Backdrop } from './Backdrop';
import { LogoMark } from './Logo';
import { colors } from '@/theme';

/** Общий каркас «01 · Войти» и «01 · Регистрация»: фон со стеклом, знак 30×37, поля 352×52 с шагом 14. */
export function AuthForm({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <Backdrop name="login" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: 13 }}>
            <LogoMark size={37} />
          </View>
          <View style={{ gap: 14 }}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
