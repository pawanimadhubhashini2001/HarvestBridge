import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'harvestbridge.auth.token';
let cachedToken: string | null | undefined;

function canUseSecureStore() {
  return (
    Platform.OS !== 'web' &&
    typeof SecureStore.getItemAsync === 'function' &&
    typeof SecureStore.setItemAsync === 'function' &&
    typeof SecureStore.deleteItemAsync === 'function'
  );
}

async function readTokenFromStorage() {
  if (canUseSecureStore()) {
    return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  }

  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

async function writeTokenToStorage(token: string) {
  if (canUseSecureStore()) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    return;
  }

  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

async function removeTokenFromStorage() {
  if (canUseSecureStore()) {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    return;
  }

  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function getStoredToken(): Promise<string | null> {
  if (cachedToken !== undefined) {
    return cachedToken;
  }

  cachedToken = await readTokenFromStorage();

  return cachedToken;
}

export async function storeToken(token: string): Promise<void> {
  cachedToken = token;
  await writeTokenToStorage(token);
}

export async function clearStoredToken(): Promise<void> {
  cachedToken = null;
  await removeTokenFromStorage();
}
