import { ImageSourcePropType } from 'react-native';

export type BackgroundName = 'welcome' | 'login' | 'saved' | 'personal' | 'duo' | 'company';

// Фоны выгружены из Figma (группа «background»: картинка + 6 полос Glass), @2x JPG.
export const BACKGROUNDS: Partial<Record<BackgroundName, ImageSourcePropType>> = {
  welcome: require('../../assets/bg/welcome.jpg'),
  login: require('../../assets/bg/login.jpg'),
  saved: require('../../assets/bg/saved.jpg'),
  personal: require('../../assets/bg/personal.jpg'),
  duo: require('../../assets/bg/duo.jpg'),
  company: require('../../assets/bg/company.jpg'),
};
