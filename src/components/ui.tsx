import { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fonts, gradients, radius, SCREEN_PADDING } from '@/theme';
import { TAB_BAR_SPACE } from './TabBar';

/* ───────── Текст ───────── */

export type Weight = 'regular' | 'medium' | 'bold' | 'extra';
type TxtProps = TextProps & { size?: number; weight?: Weight; color?: string; center?: boolean; lh?: number; style?: StyleProp<TextStyle> };

export function Txt({ size = 14, weight = 'regular', color = colors.white, center, lh, style, ...rest }: TxtProps) {
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts[weight], fontSize: size, color, lineHeight: lh ?? Math.round(size * 1.28) },
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
}

/** Подпись капсом 10 Bold: «ЛИЧНЫЙ», «КОМПАНИЯ». */
export function Label({ children, color = colors.mutedOnLight }: { children: ReactNode; color?: string }) {
  return (
    <Txt size={10} weight="bold" color={color} lh={13}>
      {children}
    </Txt>
  );
}

/* ───────── Кнопки ───────── */

type ButtonVariant = 'orange' | 'black' | 'white' | 'ghost';
const BTN: Record<ButtonVariant, { bg: string; fg: string }> = {
  orange: { bg: colors.orange, fg: colors.white },
  black: { bg: colors.black, fg: colors.white },
  white: { bg: colors.white, fg: colors.black },
  ghost: { bg: 'transparent', fg: colors.orange },
};

export function Button({
  title,
  onPress,
  variant = 'orange',
  arrow,
  small,
  fg,
  height = 52,
  r = radius.button,
  size = 15,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  arrow?: boolean;
  small?: boolean;
  fg?: string;
  height?: number;
  r?: number;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = BTN[variant];
  const color = fg ?? v.fg;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { height: small ? 36 : height, borderRadius: small ? 13 : r, backgroundColor: v.bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        small && { paddingHorizontal: 14 },
        style,
      ]}
    >
      <Txt size={small ? 13 : size} weight="bold" color={color}>
        {title}
      </Txt>
      {arrow && (
        <View style={styles.btnArrow}>
          <ArrowIcon color={color} />
        </View>
      )}
    </Pressable>
  );
}

function ArrowIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M4 10H16M16 10L11 5M16 10L11 15" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BackIcon({ color = colors.white }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M13.5 5.5L8 11L13.5 16.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckIcon({ color = colors.black, size = 13 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronIcon({ color = colors.black, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M7 4L12 9L7 14" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Назад"
      hitSlop={6}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      style={({ pressed }) => [styles.back, pressed && { opacity: 0.8 }]}
    >
      <BackIcon />
    </Pressable>
  );
}

/* ───────── Карточки ───────── */

type CardTone = 'orange' | 'white' | 'dark';
export function Card({
  tone = 'white',
  children,
  onPress,
  r = radius.card,
  style,
}: {
  tone?: CardTone;
  children: ReactNode;
  onPress?: () => void;
  r?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = tone === 'orange' ? colors.orange : tone === 'white' ? colors.white : colors.placeholder;
  const body = [styles.card, { backgroundColor: bg, borderRadius: r }, style];
  if (!onPress) return <View style={body}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [...body, pressed && { opacity: 0.92 }]}>
      {children}
    </Pressable>
  );
}

/* ───────── Аватары ───────── */

const AVATAR_COLORS = [colors.peach, colors.orange, colors.gray, colors.sun, colors.graphite];
export function avatarColor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** Круглый аватар с буквой — для списков участников. */
export function Avatar({ name, size = 40, bg, ring }: { name: string; size?: number; bg?: string; ring?: string }) {
  const fill = bg ?? avatarColor(name);
  const dark = fill === colors.sun || fill === colors.graphite || fill === colors.black;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: fill,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 2 : 0,
        borderColor: ring,
      }}
    >
      <Txt size={size * 0.4} weight="bold" color={dark ? colors.white : colors.black}>
        {name.slice(0, 1).toUpperCase()}
      </Txt>
    </View>
  );
}

/** Стопка квадратных плашек 26×26 r9, как в плитках главной: первая оранжевая, дальше серые с белой обводкой. */
export function SquareStack({ count }: { count: number }) {
  const n = Math.min(Math.max(count, 1), 3);
  return (
    <View style={{ flexDirection: 'row', height: 26 }}>
      {Array.from({ length: n }, (_, i) => (
        <View
          key={i}
          style={{
            width: 26,
            height: 26,
            borderRadius: 9,
            marginLeft: i === 0 ? 0 : i === 1 ? -10 : -16,
            backgroundColor: i === 0 ? colors.orange : colors.gray,
            borderWidth: i === 0 ? 0 : 2,
            borderColor: colors.white,
          }}
        />
      ))}
    </View>
  );
}

/* ───────── Поля и чипы ───────── */

export function Field({ dark, style, ...props }: TextInputProps & { dark?: boolean }) {
  return (
    <TextInput
      placeholderTextColor={colors.gray}
      selectionColor={colors.orange}
      {...props}
      style={[
        styles.field,
        { backgroundColor: dark ? colors.field : colors.white },
        props.multiline && { height: undefined, minHeight: 52, paddingTop: 15, textAlignVertical: 'top' },
        style,
      ]}
    />
  );
}

export function Chip({
  title,
  active,
  onPress,
  tone = 'dark',
}: {
  title: string;
  active?: boolean;
  onPress?: () => void;
  tone?: 'dark' | 'light';
}) {
  const bg = active ? colors.orange : tone === 'dark' ? colors.graphite : colors.field;
  const fg = active ? colors.white : tone === 'dark' ? colors.white : colors.black;
  return (
    <Pressable onPress={onPress} style={[styles.chip, { backgroundColor: bg }]}>
      <Txt size={13} weight="bold" color={fg}>
        {title}
      </Txt>
    </Pressable>
  );
}

/** Строка «✓  текст». В макете галочка — часть текста, поэтому так же. */
export function CheckLine({ text, color = colors.black, size = 13, weight = 'bold' as Weight }: { text: string; color?: string; size?: number; weight?: Weight }) {
  return (
    <Txt size={size} weight={weight} color={color}>
      {'✓  '}
      {text}
    </Txt>
  );
}

/* ───────── Экран ───────── */

/**
 * Каркас экрана по сетке Figma (402×874): шапка на y=50 высотой 50, контент с y=140,
 * поля 24. Плашки «dynamic island» нет — её место занимает настоящий Dynamic Island iPhone.
 */
export function Screen({
  children,
  title,
  titleSize,
  centerTitle,
  back = false,
  right,
  withTabBar = false,
  scroll = true,
  gap = 14,
  contentTop = 40,
  contentStyle,
}: {
  children: ReactNode;
  title?: string;
  titleSize?: number;
  centerTitle?: boolean;
  back?: boolean;
  right?: ReactNode;
  withTabBar?: boolean;
  scroll?: boolean;
  gap?: number;
  contentTop?: number;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top - 12, 16);
  const bottom = (withTabBar ? TAB_BAR_SPACE : 0) + Math.max(insets.bottom, 16) + 16;
  const header =
    title || back || right ? (
      <View style={[styles.header, centerTitle && { justifyContent: 'center' }]}>
        {back && <BackButton />}
        {title && (
          <Txt
            size={titleSize ?? (back ? 21 : 26)}
            weight="bold"
            color={centerTitle ? '#FAF8F4' : colors.white}
            style={centerTitle ? undefined : { flex: 1 }}
            numberOfLines={1}
          >
            {title}
          </Txt>
        )}
        {right}
      </View>
    ) : null;
  const inner = <View style={[{ gap, paddingTop: header ? contentTop : 0 }, contentStyle]}>{children}</View>;
  return (
    <View style={[styles.screen, { paddingTop: top }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, paddingBottom: bottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {header}
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: SCREEN_PADDING, paddingBottom: bottom }}>
          {header}
          {inner}
        </View>
      )}
    </View>
  );
}

/* ───────── Градиенты ───────── */

export function OrangeGradient({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <LinearGradient colors={[...gradients.orange]} locations={[...gradients.orangeStops]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

/* ───────── Оверлей (белая карточка по центру, как Frame 15) ───────── */

export function Overlay({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.overlay} onPress={() => {}}>
          <Txt size={26} weight="bold" color={colors.black} center>
            {title}
          </Txt>
          {subtitle && (
            <Txt size={13} color={colors.mutedOnLight} center>
              {subtitle}
            </Txt>
          )}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 50 },
  btn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, flexDirection: 'row' },
  btnArrow: { position: 'absolute', right: 16 },
  back: { width: 40, height: 44, borderRadius: radius.back, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 20, gap: 6 },
  field: { height: 52, borderRadius: radius.button, paddingHorizontal: 16, fontFamily: fonts.bold, fontSize: 15, color: colors.black },
  chip: { borderRadius: radius.chip, paddingHorizontal: 14, paddingVertical: 9 },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, alignItems: 'center', justifyContent: 'center', padding: 15 },
  overlay: {
    width: '100%',
    maxWidth: 372,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 18,
    gap: 12,
  },
});
