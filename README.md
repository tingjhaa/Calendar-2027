# Calendar 2027 — The Sweet Atelier

React Native (Expo) port of `calendar_2027_the_sweet_atelier_edition.html`.
The whole app lives in `App.tsx`; there is no separate web build, the same code
runs on iOS, Android and the browser through React Native Web.

## Run

```bash
npm install
npm start        # Expo dev server — press i / a, or scan the QR code
npm run web      # open in the browser at http://localhost:8081
```

## Type-check

```bash
npm run tsc      # tsc --noEmit, must stay clean
```

## Layout

| File | Purpose |
| --- | --- |
| `App.tsx` | Entire screen: calendar grid, holidays list, daily notes, light/dark themes |
| `index.js` | Expo entry point (`registerRootComponent`) |
| `app.json` | Expo config (iOS bundle id, Android package, web bundler) |
| `babel.config.js` | `babel-preset-expo` |
| `tsconfig.json` | Extends `expo/tsconfig.base`, strict mode, `noEmit` |

## Data

- Notes are persisted with `@react-native-async-storage/async-storage` under the
  key `dior_atelier_calendar_notes_2027` (localStorage on web).
- Holidays (`HOLIDAYS`), advent drawer content (`ADVENT_GIFTS`) and the theme
  tokens (`THEMES`) are static constants in `App.tsx`.
- "Today" is pinned to 26 November 2026 (`TODAY_KEY`) to match the referenced design.
