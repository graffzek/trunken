import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Txt } from '@/components/ui';
import { colors } from '@/theme';

type Mode = 'photo' | 'text';

// Камера: «+» в таб-баре → снимок → «Новый момент»
export default function Camera() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cam = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>('photo');

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const toMoment = (uri?: string) => router.replace({ pathname: '/moment', params: uri ? { uri } : {} });

  const shoot = async () => {
    if (mode !== 'photo') return toMoment();
    if (!cam.current || !ready || busy) return;
    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const photo = await cam.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) toMoment(photo.uri);
    } finally {
      setBusy(false);
    }
  };

  const gallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!res.canceled) toMoment(res.assets[0].uri);
  };

  const granted = permission?.granted;

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <View style={styles.finder}>
        {granted ? (
          <CameraView ref={cam} style={StyleSheet.absoluteFill} facing={facing} flash={flash} onCameraReady={() => setReady(true)} />
        ) : (
          <LinearGradient colors={['#474747', '#29201B', '#8D2400']} locations={[0, 0.6, 1]} style={[StyleSheet.absoluteFill, styles.center]}>
            {permission && (
              <View style={{ gap: 12, paddingHorizontal: 40, alignItems: 'center' }}>
                <Txt size={15} weight="medium" center>
                  {permission.canAskAgain ? 'Разреши доступ к камере, чтобы сохранять моменты.' : 'Доступ к камере выключен. Включи его в Настройках iPhone.'}
                </Txt>
                {permission.canAskAgain && <Button title="Разрешить камеру" onPress={requestPermission} />}
                <Button title="Без фото — просто текст" variant="ghost" fg={colors.white} onPress={() => toMoment()} />
              </View>
            )}
          </LinearGradient>
        )}

        <View style={[styles.topRow, { top: insets.top + 12 }]}>
          <Round icon="x" label="Закрыть" onPress={close} />
          {granted && <Round icon={flash === 'on' ? 'zap' : 'zap-off'} label="Вспышка" onPress={() => setFlash((f) => (f === 'on' ? 'off' : 'on'))} />}
        </View>

        <View style={styles.modes}>
          {(['photo', 'text'] as Mode[]).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} hitSlop={8}>
              <Txt size={12} weight="bold" color={mode === m ? colors.orange : '#9A9A9A'}>
                {m === 'photo' ? 'ФОТО' : 'ТЕКСТ'}
              </Txt>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + 18 }]}>
        <Pressable onPress={gallery} style={styles.gallery} accessibilityLabel="Галерея">
          <Feather name="image" size={20} color={colors.white} />
        </Pressable>
        <Pressable onPress={shoot} style={styles.shutter} accessibilityLabel={mode === 'photo' ? 'Сделать снимок' : 'Продолжить'}>
          <View style={[styles.shutterInner, busy && { opacity: 0.5 }]}>
            {mode === 'text' && <Feather name="type" size={24} color={colors.white} />}
          </View>
        </Pressable>
        <Round icon="refresh-cw" label="Сменить камеру" onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))} disabled={!granted} />
      </View>
    </View>
  );
}

function Round({ icon, label, onPress, disabled }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} style={[styles.round, disabled && { opacity: 0.3 }]}>
      <Feather name={icon} size={20} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  finder: { flex: 1, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden', backgroundColor: '#1a1a1a' },
  center: { alignItems: 'center', justifyContent: 'center' },
  topRow: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between' },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  modes: { position: 'absolute', bottom: 22, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 22 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 48, paddingTop: 22 },
  gallery: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.graphite, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
});
