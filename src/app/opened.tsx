import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Txt } from '@/components/ui';
import { Backdrop } from '@/components/Backdrop';
import { LogoMark } from '@/components/Logo';

const COPY = {
  personal: { title: 'Новая серия\nоткрыта!', btn: 'Вернуться на главную' },
  duo: { title: 'Дуо-серия\nоткрыта!', btn: 'На главную' },
  company: { title: 'Компания\nсоздана!', btn: 'Открыть компанию' },
} as const;

// «Новая серия открыта» / «Дуо-серия открыта» / «Компания создана» — у каждого свой фон из Figma
export default function Opened() {
  const { kind = 'personal', id } = useLocalSearchParams<{ kind?: keyof typeof COPY; id?: string }>();
  const router = useRouter();
  const k = (kind in COPY ? kind : 'personal') as keyof typeof COPY;
  const copy = COPY[k];

  const next = () => {
    if (k === 'company' && id) {
      router.dismissTo('/');
      router.push({ pathname: '/company/[id]', params: { id } });
    } else router.dismissTo('/');
  };

  return (
    <View style={{ flex: 1 }}>
      <Backdrop name={k} />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', height: 56, justifyContent: 'center' }}>
          <LogoMark size={42} />
        </View>
        <Txt size={36} weight="bold" lh={47} center>
          {copy.title}
        </Txt>
        <Button title={copy.btn} onPress={next} style={{ marginTop: 14 }} />
      </View>
    </View>
  );
}
