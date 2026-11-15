import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients } from '@/theme';

export type TabKey = 'home' | 'people' | 'archive' | 'games';

/*
 * Таб-бар 1:1 с компонентом «Component 6» из Figma:
 * белая форма Union 282×64 (вкладки выше основания, между ними «волна»),
 * активная вкладка — оранжевая плашка 51×49 (скругления 20/13),
 * «+» — 60×64 с оранжевым градиентом (скругления 25/17).
 */

const UNION =
  'M44 0C52 0 59.13 3.76 63.7 9.61C65.25 11.58 67.49 13 70 13C72.51 13 74.75 11.58 76.3 9.61C80.87 3.76 88 0 96 0H115C123 0 130.13 3.76 134.7 9.61C136.25 11.58 138.49 13 141 13C143.51 13 145.76 11.58 147.3 9.61C151.87 3.76 159 0 167 0H186C194 0 201.13 3.76 205.7 9.61C207.25 11.58 209.49 13 212 13C214.51 13 216.76 11.58 218.3 9.61C222.87 3.76 230 0 238 0H257C270.81 0 282 11.19 282 25V47C282 56.39 274.39 64 265 64H17C7.61 64 0 56.39 0 47V25C0 11.19 11.19 0 25 0H44Z';

const ICONS: Record<TabKey | 'plus', string> = {
  home: 'M13.13 17.5H18.38V8.75L10.5 2.63L2.63 8.75V17.5H7.88M13.13 17.5H7.88M13.13 17.5V11.38H7.88V17.5',
  people:
    'M14 18.38V16.63C14 15.7 13.63 14.81 12.97 14.15C12.32 13.49 11.43 13.13 10.5 13.13H5.25C4.32 13.13 3.43 13.49 2.78 14.15C2.12 14.81 1.75 15.7 1.75 16.63V18.38M14.88 3.5C15.8 3.5 16.69 3.87 17.35 4.53C18.01 5.18 18.38 6.07 18.38 7C18.38 7.93 18.01 8.82 17.35 9.47C16.69 10.13 15.8 10.5 14.88 10.5M19.25 18.38V16.63C19.25 15.85 18.99 15.1 18.52 14.48C18.04 13.87 17.38 13.43 16.63 13.24M7.88 9.63C8.8 9.63 9.69 9.26 10.35 8.6C11.01 7.94 11.38 7.05 11.38 6.13C11.38 5.2 11.01 4.31 10.35 3.65C9.69 2.99 8.8 2.63 7.88 2.63C6.95 2.63 6.06 2.99 5.4 3.65C4.74 4.31 4.38 5.2 4.38 6.13C4.38 7.05 4.74 7.94 5.4 8.6C6.06 9.26 6.95 9.63 7.88 9.63Z',
  archive: 'M3.5 7H17.5M3.5 7V18.38H17.5V7M3.5 7H2.63V2.63H18.38V7H17.5M7.88 10.5H13.13',
  games:
    'M6.54 9V10.75M6.54 10.75V12.5M6.54 10.75L4.58 10.75M6.54 10.75H8.5M15 9H15.01M15.49 11.5H15.5M12.99 12H13M12.5 9.5H12.51M6.13 6.13H14.88C15.67 6.1 16.45 6.35 17.09 6.82C17.72 7.3 18.18 7.98 18.38 8.75L19.25 14.88C19.21 15.36 19.04 15.83 18.75 16.23C18.46 16.62 18.06 16.93 17.61 17.11C17.15 17.29 16.65 17.35 16.17 17.26C15.69 17.17 15.24 16.95 14.88 16.63L13.13 14.88H7.88L6.13 16.63C5.76 16.95 5.31 17.17 4.83 17.26C4.35 17.35 3.85 17.29 3.39 17.11C2.94 16.93 2.54 16.62 2.25 16.23C1.96 15.83 1.79 15.36 1.75 14.88L2.63 8.75C2.82 7.98 3.28 7.3 3.91 6.82C4.55 6.35 5.33 6.1 6.13 6.13Z',
  plus: 'M10.5 4.38V10.5M10.5 10.5V16.63M10.5 10.5H4.38M10.5 10.5H16.63',
};

export function TabIcon({ name, color, size = 21 }: { name: keyof typeof ICONS; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Path d={ICONS[name]} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const TABS: { key: TabKey; href: '/' | '/people' | '/archive' | '/games'; label: string }[] = [
  { key: 'home', href: '/', label: 'Главная' },
  { key: 'people', href: '/people', label: 'Мои люди' },
  { key: 'archive', href: '/archive', label: 'Архив вечеров' },
  { key: 'games', href: '/games', label: 'Игры' },
];

/** Высота области, которую контент должен оставить под таб-баром. */
export const TAB_BAR_SPACE = 64 + 24;

export function TabBar({ active }: { active: TabKey }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom - 16, 12);

  return (
    <>
      {/* Плавная тень ПОД таб-баром: контент мягко уходит в фон и не сливается с плашками */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(22,22,22,0)', 'rgba(22,22,22,0.85)', colors.black]}
        locations={[0, 0.45, 1]}
        style={[styles.fade, { height: 64 + bottom + 70 }]}
      />
      <View style={[styles.wrap, { bottom }]} pointerEvents="box-none">
        <View style={styles.bar}>
          <Svg width={282} height={64} viewBox="0 0 282 64" style={StyleSheet.absoluteFill}>
            <Path d={UNION} fill={colors.white} />
          </Svg>
          {TABS.map((t, i) => {
            const on = t.key === active;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityLabel={t.label}
                accessibilityState={{ selected: on }}
                onPress={() => !on && router.replace(t.href)}
                style={[styles.item, { left: i * 71 }]}
                hitSlop={4}
              >
                <View style={[styles.indicator, on && { backgroundColor: colors.orange }]}>
                  <TabIcon name={t.key} color={on ? colors.sun : colors.black} />
                </View>
              </Pressable>
            );
          })}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Новый момент: камера" onPress={() => router.push('/camera')}>
          {({ pressed }) => (
            <LinearGradient
              colors={[...gradients.orange]}
              locations={[...gradients.orangeStops]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.plus, pressed && { opacity: 0.85 }]}
            >
              <TabIcon name="plus" color={colors.white} size={24} />
            </LinearGradient>
          )}
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  wrap: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 11 },
  bar: { width: 282, height: 64 },
  item: { position: 'absolute', top: 0, width: 69, height: 64, alignItems: 'center', paddingTop: 8 },
  indicator: {
    width: 51,
    height: 49,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    width: 60,
    height: 64,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
