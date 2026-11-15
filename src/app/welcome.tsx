import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Txt } from '@/components/ui';
import { Backdrop } from '@/components/Backdrop';
import { LogoMark } from '@/components/Logo';
import { colors } from '@/theme';

// 01 · Добро пожаловать (Figma: логотип y133, слоган y437, кнопка y742, подпись y805)
export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 20);
  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <Backdrop name="welcome" />
      <View style={{ position: 'absolute', top: 133, left: 0, right: 0, alignItems: 'center' }}>
        <LogoMark size={131} />
        <Txt size={52} weight="extra" lh={68} style={{ marginTop: 8 }}>
          trunken
        </Txt>
      </View>
      <View style={{ position: 'absolute', left: 31, right: 31, bottom: bottom + 247, gap: 0 }}>
        <Txt size={31} weight="bold" lh={40} center>
          {'Хорошие вечера.\nБлизкие люди.\nВсё остаётся с тобой.'}
        </Txt>
        <Txt size={14} lh={18} color={colors.gray} center>
          {'Сохраняй моменты, играй с друзьями\nи собирай историю.'}
        </Txt>
      </View>
      <View style={{ position: 'absolute', left: 25, right: 25, bottom: bottom + 13 }}>
        <Button title="Начать свою историю" arrow onPress={() => router.push('/login')} />
        <Txt size={12} lh={16} color={colors.gray} center style={{ marginTop: 11 }}>
          Без гонки за сериями. В своём ритме.
        </Txt>
      </View>
    </View>
  );
}
