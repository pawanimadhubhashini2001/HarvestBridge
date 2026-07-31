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
