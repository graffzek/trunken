import { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme';
import { BACKGROUNDS, BackgroundName } from './backgrounds';

/**
 * Фоны экранов из Figma: картинка + 6 вертикальных полос с эффектом Glass.
 * Стекло Figma в React Native живьём не повторить, поэтому фоны выгружены
 * из макета готовыми изображениями (assets/bg). Если картинки нет — рисуем полосы градиентом.
 */
export function Backdrop({ name, children }: { name: BackgroundName; children?: ReactNode }) {
  const src = BACKGROUNDS[name];
  if (src)
    return (
      <ImageBackground source={src} resizeMode="cover" style={StyleSheet.absoluteFill}>
        {children}
      </ImageBackground>
    );
  return <Stripes>{children}</Stripes>;
}

function Stripes({ children }: { children?: ReactNode }) {
  const cols = [0.35, 0.55, 0.85, 1, 0.7, 0.4];
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.black, flexDirection: 'row' }]}>
      {cols.map((a, i) => (
        <LinearGradient
          key={i}
          style={{ flex: 1 }}
          colors={[`rgba(251,85,29,${a})`, `rgba(251,85,29,${a * 0.55})`, 'rgba(22,22,22,0)']}
          locations={[0, 0.45, 1]}
          start={{ x: i % 2 ? 0 : 1, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      ))}
      <LinearGradient style={StyleSheet.absoluteFill} colors={['rgba(22,22,22,0.15)', 'rgba(22,22,22,0)', 'rgba(22,22,22,0.85)']} locations={[0, 0.4, 1]} />
      {children}
    </View>
  );
}
