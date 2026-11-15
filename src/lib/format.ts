// Даты по-русски без Intl (Hermes на старых устройствах может его не иметь).
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const d = (x: Date | string) => (typeof x === 'string' ? new Date(x) : x);

/** «Пятница, 13 ноября» */
export const dayTitle = (x: Date | string) => `${WEEKDAYS[d(x).getDay()]}, ${d(x).getDate()} ${MONTHS[d(x).getMonth()]}`;
/** «12 ноября» */
export const dayMonth = (x: Date | string) => `${d(x).getDate()} ${MONTHS[d(x).getMonth()]}`;
/** «12 ноября 2026» */
export const fullDate = (x: Date | string) => `${dayMonth(x)} ${d(x).getFullYear()}`;
/** «23:48» */
export const time = (x: Date | string) => `${String(d(x).getHours()).padStart(2, '0')}:${String(d(x).getMinutes()).padStart(2, '0')}`;

/** «9–15 ноября» или «30 ноября – 6 декабря» */
export function weekRange(monday: Date): string {
  const sun = new Date(monday);
  sun.setDate(sun.getDate() + 6);
  if (monday.getMonth() === sun.getMonth()) return `${monday.getDate()}–${sun.getDate()} ${MONTHS[sun.getMonth()]}`;
  return `${dayMonth(monday)} – ${dayMonth(sun)}`;
}

/** Творительный падеж имени: «Дуо с Сашей», «с Аней», «с Димой», «с Олегом». */
export function withName(name: string): string {
  const last = name.slice(-1);
  const prev = name.slice(-2, -1);
  if (last === 'я') return name.slice(0, -1) + 'ей';
  if (last === 'а') return name.slice(0, -1) + ('шщжчц'.includes(prev) ? 'ей' : 'ой');
  if (last === 'й' || last === 'ь') return name.slice(0, -1) + 'ем';
  if (/[бвгдзклмнпрстфхжшщчц]/i.test(last)) return name + 'ом';
  return name;
}

export const capitalize =(s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** «Ты, Саша, Аня и Миша» */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} и ${names[names.length - 1]}`;
}
