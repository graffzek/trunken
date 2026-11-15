import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Onest_400Regular, Onest_500Medium, Onest_700Bold, Onest_800ExtraBold } from '@expo-google-fonts/onest';
import { StoreProvider, useStore } from '@/lib/store';
import { Button, Txt } from '@/components/ui';
import { colors } from '@/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Onest_400Regular, Onest_500Medium, Onest_700Bold, Onest_800ExtraBold });
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        {fontsLoaded ? <Navigator /> : <View style={{ flex: 1, backgroundColor: colors.black }} />}
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Navigator() {
  const { ready, signedIn, banned, isModerator, logout } = useStore();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.black }} />;

  if (signedIn && banned)
    return (
      <View style={{ flex: 1, backgroundColor: colors.black, justifyContent: 'center', padding: 24, gap: 16 }}>
        <Txt size={26} weight="bold" center>
          Аккаунт заблокирован
        </Txt>
        <Txt size={14} color={colors.gray} center>
          Модератор ограничил доступ к этому аккаунту.
        </Txt>
        <Button title="Выйти" variant="white" onPress={logout} />
      </View>
    );

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.black } }}>
      <Stack.Protected guard={!signedIn} redirectTo="/">
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn} redirectTo="/welcome">
        {/* вкладки: переключаются без анимации, как таб-бар */}
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="people" options={{ animation: 'none' }} />
        <Stack.Screen name="archive" options={{ animation: 'none' }} />
        <Stack.Screen name="games" options={{ animation: 'none' }} />

        <Stack.Screen name="streaks" />
        <Stack.Screen name="evening/[id]" />
        <Stack.Screen name="save-evening" />
        <Stack.Screen name="evening-saved" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="game/who" />
        <Stack.Screen name="game/answered" options={{ animation: 'fade' }} />
        <Stack.Screen name="opened" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="duo/[id]" />
        <Stack.Screen name="company/[id]/index" />
        <Stack.Screen name="company/[id]/invite" />
        <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="moment" />
        <Stack.Protected guard={isModerator} redirectTo="/">
          <Stack.Screen name="moderation" />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  );
}
