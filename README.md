# Trunken

iOS-приложение про хорошие вечера с близкими: серийчики (личный, дуо, компания), архив вечеров, игры.
Expo SDK 58 + Expo Router, TypeScript. Дизайн — Figma «APP TRUNKEN».

## Запуск на iPhone (без Мака)

1. Поставь на iPhone **Expo Go** из App Store.
2. На компьютере в папке проекта:
   ```bash
   npm install
   npx expo start
   ```
3. Отсканируй QR-код из терминала камерой iPhone → откроется Expo Go.
   Телефон и компьютер должны быть в одной Wi-Fi сети. Если не подключается:
   ```bash
   npx expo start --tunnel
   ```

Правишь код — приложение на телефоне обновляется само.

## Без компьютера: облачные обновления (EAS Update)

Проект: https://expo.dev/accounts/somovd/projects/trunken
Открывается в Expo Go, если в нём выполнен вход в аккаунт **somovd** (с мая 2026 Expo Go грузит
облачные обновления только для своих проектов).

Выпустить новую версию после правок кода (Windows, без git):
```bash
set EAS_NO_VCS=1&& npx.cmd eas-cli@latest update --branch main --platform ios --environment production --message "что поменялось"
```

## Данные: Supabase

Схема базы с ролями `user` / `moderator` — `supabase/schema.sql` (вставить в SQL Editor и Run).

- Вход по логину: внутри он превращается в адрес `логин@trunken.app`, поэтому в Supabase
  нужно выключить **Authentication → Sign In / Providers → Email → Confirm email**.
- Новый аккаунт всегда `user`. Модератора назначить в SQL Editor:
  `update public.profiles set role = 'moderator' where nickname = 'логин';`
- Модератор: нажать оранжевый знак на главной → «Модерация» (жалобы, скрытие/удаление вечеров,
  блокировка, выдача роли). На чужом вечере — кнопки «Скрыть» и «Удалить».
- Обычный пользователь может пожаловаться на чужой вечер.
- Код: `src/lib/supabase.ts` (клиент), `src/lib/store.tsx` (данные), `src/lib/moderation.ts`.

## Меню профиля

Нажатие на оранжевый знак на главной — выход из аккаунта и (для модератора) «Модерация».

## Что где

| Путь | Что |
|---|---|
| `src/app/` | экраны (каждый файл — маршрут) |
| `src/components/ui.tsx` | кнопки, карточки, поля, оверлей, фон с полосами |
| `src/components/TabBar.tsx` | нижняя панель + «+» (камера) |
| `src/components/CreateFlow.tsx` | оверлеи «Серийчик» → «Пригласить друга» / «Новая компания» |
| `src/components/Logo.tsx` | логотип (векторы из Figma) |
| `src/lib/streaks.ts` | правила серийчиков со страницы Idea |
| `src/lib/store.tsx` | данные на устройстве (AsyncStorage) и демо |
| `src/theme/` | цвета, шрифт Onest, радиусы |
| `tests/` | тесты правил: `npm test` |

## Проверки

```bash
npm run typecheck
npm test
npx expo-doctor
```

## Пока не сделано

- **Друзья без своего аккаунта Expo** не откроют приложение в Expo Go — для них нужна сборка
  TestFlight (Apple Developer, $99/год).
- **Push-уведомления** о приглашениях — сейчас приглашения видны при открытии «Моих людей».
- **Виджеты iOS** и push-уведомления требуют сборки через EAS (не работают в Expo Go).
