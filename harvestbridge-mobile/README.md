# HarvestBridge Mobile

Lesson 101 configures the React Native project foundation for Laravel API integration.

## Setup

1. Create a local environment file from `.env.example`.
2. Set `EXPO_PUBLIC_API_BASE_URL` to your Laravel API base URL, including `/api`.
3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm run start
```

`npm run start` uses Expo LAN mode and tells Expo to advertise this computer's Wi-Fi IP address when one is detected. Keep your phone on the same Wi-Fi network as this computer; LAN mode will fail if the phone is on mobile data/4G.

If Expo Go still shows `Failed to download remote update`, restart with a clean bundle cache:

```bash
npm run start -- --clear
```

If LAN is blocked by your router or firewall, try Expo tunnel mode:

```bash
npm run start:tunnel -- --clear
```

If the phone cannot use the same Wi-Fi and tunnel mode is unavailable, connect the Android phone by USB, enable USB debugging, and run:

```bash
npm run android:usb -- --clear
```

For a physical phone, do not leave `EXPO_PUBLIC_API_BASE_URL` pointed at `127.0.0.1` or `localhost`; those addresses refer to the phone itself. Use your computer's LAN IP, for example `http://192.168.1.10:8000/api`, or a public API URL.

## Architecture

- `src/app`: Expo Router route files
- `src/api`: Axios client and React Query client
- `src/components`: shared UI primitives
- `src/contexts`: auth session state
- `src/screens`: feature screens
- `src/services`: storage and session helpers
- `src/theme`: app themes and tokens
- `src/types`: shared TypeScript contracts
- `src/utils`: environment and error helpers

## Backend Integration

Configured endpoints:

- `GET /api/profile`
- `POST /api/logout`

Authentication storage uses `expo-secure-store` and sends Sanctum bearer tokens through Axios interceptors.

## Tooling

- `npm run lint`
- `npm run lint:fix`
- `npm run format`
- `npm run format:check`
