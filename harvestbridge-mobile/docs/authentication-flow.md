# Authentication Flow Documentation

## Overview

HarvestBridge mobile uses Laravel Sanctum token authentication through the existing backend APIs.
The mobile app keeps an in-memory auth session for runtime navigation and uses persisted token storage for app restarts.

## Endpoints Used

- `POST /login`
- `POST /register`
- `POST /forgot-password`
- `POST /logout`
- `GET /profile`

## Login Flow

1. User submits email and password from the login screen.
2. The app calls `POST /login`.
3. Laravel returns an auth token and the authenticated user payload.
4. The app stores the token in secure storage on native devices, with AsyncStorage fallback on web.
5. The auth context applies the session in memory.
6. The app fetches `GET /profile` to validate the token and hydrate the latest user profile.
7. Navigation switches from the auth stack to the protected app stack.

## Logout Flow

1. User taps `Logout`.
2. The auth context calls `POST /logout` when a current token exists.
3. Local auth state is cleared.
4. Persisted token storage is cleared.
5. React Query cache is cleared to avoid stale authenticated data.
6. Navigation falls back to the auth stack.

## App Startup Flow

1. App launches and shows the splash/loading screen.
2. Auth context loads the persisted token.
3. If no token exists, the app stays unauthenticated and opens the auth stack.
4. If a token exists, the app calls `GET /profile`.
5. If the profile request succeeds, the user is marked authenticated and the app stack opens.
6. If the profile request fails with `401 Unauthorized`, the token is removed and the app returns to login.

## Token Validation Flow

1. Every authenticated API request attaches the bearer token.
2. Requests prefer the in-memory/default auth header first and only fall back to stored token lookup when needed.
3. If the backend responds with `401 Unauthorized`, the global axios interceptor clears the stored token.
4. The interceptor notifies the auth context through the unauthorized session event channel.
5. The auth context clears local session state without re-calling logout, preventing duplicate cleanup loops.
6. The user is redirected to the auth stack with a session-expired message.

## Protected Navigation Flow

1. `RootNavigator` waits for auth hydration to finish.
2. `ProtectedRoute` only renders the main app when authentication is valid.
3. `GuestRoute` prevents authenticated users from revisiting login/register/forgot-password screens.

## Testing Checklist

- Login with a valid account and confirm navigation opens the main app.
- Login with invalid credentials and confirm Laravel validation or auth errors render correctly.
- Register a new account and confirm the app logs in automatically when the backend returns a token.
- Submit forgot password with a valid email and confirm the success state is shown.
- Restart the app after login and confirm the session is restored from persisted storage.
- Remove or invalidate the token on the backend and confirm app startup redirects back to login.
- Trigger a `401` from a protected API call and confirm the app logs out once and returns to login.
- Use the logout action from the profile screen and confirm token, user state, and protected screens are cleared.
- Confirm protected routes cannot be reached while unauthenticated.
- Confirm auth screens are not reachable after login unless the session is cleared.

## Known Issues

- React Native Paper icon warnings still depend on installing a compatible icon package in the Expo project.
- Some project-wide lint warnings exist outside the authentication module and were not changed in this lesson.
- Web runtime may still show animation warnings that are caused by dependency behavior rather than auth logic.

## Future Improvements

- Add refresh-token support if the backend introduces token rotation.
- Persist a small auth metadata object such as last-login timestamp and remember-me preference.
- Add dedicated auth hooks like `useLogin`, `useLogout`, and `useRegister` for cleaner screen composition.
- Add query-key level cache invalidation once more authenticated modules are implemented.
- Add automated integration tests for startup hydration, unauthorized redirects, and logout cleanup.
