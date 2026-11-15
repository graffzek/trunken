// Токены из Figma-файла APP TRUNKEN (страница Idea + стили файла).
export const colors = {
  orange: '#FB551D',
  peach: '#FFBCA6',
  sun: '#8D2400',
  black: '#161616',
  graphite: '#474747',
  gray: '#D9D9D9',
  white: '#FFFFFF',
  // производные для тёмной темы
  muted: '#8A8A8A',
  mutedOnLight: '#716B66',
  field: '#F2F1EF',
  placeholder: '#2A2A2A',
  backdrop: 'rgba(0,0,0,0.6)',
} as const;

export const gradients = {
  orange: ['#FB551D', '#FF8056', '#FB551D'] as const,
  orangeStops: [0.14, 0.52, 0.75] as const,
  gold: ['#CF9324', '#F4BE5A', '#CF9324'] as const,
  silver: ['#DEDEDD', '#A3A3A3', '#DEDEDD'] as const,
};

export const fonts = {
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  bold: 'Onest_700Bold',
  extra: 'Onest_800ExtraBold',
} as const;

export const radius = { card: 24, button: 18, chip: 16, back: 15 } as const;
export const space = { xs: 4, s: 8, m: 16, l: 24 } as const;
export const SCREEN_PADDING = 24;
export const TAB_BAR_HEIGHT = 64;
