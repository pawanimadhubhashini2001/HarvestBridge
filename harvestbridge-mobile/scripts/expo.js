#!/usr/bin/env node
/* global __dirname */

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(root, '..');
const expoCli = path.join(root, 'node_modules', 'expo', 'bin', 'cli');
const localAndroidSdk = path.join(workspaceRoot, '.android-sdk');
const args = process.argv.slice(2);

function getHostMode(args) {
  const hostIndex = args.findIndex((arg) => arg === '--host' || arg === '-m');

  if (hostIndex !== -1 && args[hostIndex + 1]) {
    return args[hostIndex + 1];
  }

  if (args.includes('--tunnel')) {
    return 'tunnel';
  }

  if (args.includes('--lan')) {
    return 'lan';
  }

  if (args.includes('--localhost')) {
    return 'localhost';
  }

  return 'lan';
}

function printStartHint(args) {
  if (args[0] !== 'start') {
    return;
  }

  const hostMode = getHostMode(args);
  console.log(`[HarvestBridge] Starting Expo with ${hostMode} host mode.`);

  if (hostMode === 'tunnel') {
    console.log(
      '[HarvestBridge] Tunnel depends on Expo/ngrok infrastructure. If it fails, use `npm run start` for LAN mode.',
    );
    return;
  }

  if (hostMode === 'lan') {
    const lanIpAddress = getLanIpAddress();

    if (lanIpAddress) {
      console.log(`[HarvestBridge] LAN URL should use this computer IP: ${lanIpAddress}`);
    }

    console.log(
      '[HarvestBridge] Keep your phone on the same Wi-Fi. Mobile data/4G cannot reach this LAN URL.',
    );
    console.log(
      '[HarvestBridge] If Wi-Fi is not available, connect by USB and run `npm run android:usb -- --clear`.',
    );
    return;
  }

  if (hostMode === 'localhost') {
    console.log(
      '[HarvestBridge] Localhost mode is for an Android phone connected by USB with USB debugging enabled.',
    );
    if (hasLocalAndroidSdk()) {
      console.log(`[HarvestBridge] Using local Android SDK: ${localAndroidSdk}`);
      ensureReversePort(8081);
      console.log(
        '[HarvestBridge] When Metro is waiting, run `npm run android:usb:open` in another terminal.',
      );
    }
  }
}

function getLanIpAddress() {
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter(
      (address) =>
        address &&
        address.family === 'IPv4' &&
        !address.internal &&
        !address.address.startsWith('169.254.'),
    )
    .map((address) => address.address);

  return addresses.find((address) => address.startsWith('192.168.')) ?? addresses[0];
}

const env = {
  ...process.env,
  EXPO_HOME: process.env.EXPO_HOME || path.join(root, '.expo-home'),
  npm_config_cache: process.env.npm_config_cache || path.join(root, '.npm-cache'),
};

function hasLocalAndroidSdk() {
  return fs.existsSync(path.join(localAndroidSdk, 'platform-tools', 'adb.exe'));
}

function ensureReversePort(port) {
  const adb = path.join(localAndroidSdk, 'platform-tools', 'adb.exe');
  const result = spawnSync(adb, ['reverse', `tcp:${port}`, `tcp:${port}`], {
    cwd: root,
    env,
    stdio: 'ignore',
  });

  if (result.status !== 0) {
    console.log(
      `[HarvestBridge] Could not set adb reverse for port ${port}. Run \`npm run adb:devices\` and reconnect the phone.`,
    );
  }
}

if (hasLocalAndroidSdk()) {
  const platformTools = path.join(localAndroidSdk, 'platform-tools');

  env.ANDROID_HOME = env.ANDROID_HOME || localAndroidSdk;
  env.ANDROID_SDK_ROOT = env.ANDROID_SDK_ROOT || localAndroidSdk;
  env.PATH = `${platformTools}${path.delimiter}${env.PATH ?? ''}`;
}

if (getHostMode(args) === 'lan' && !env.REACT_NATIVE_PACKAGER_HOSTNAME) {
  const lanIpAddress = getLanIpAddress();

  if (lanIpAddress) {
    env.REACT_NATIVE_PACKAGER_HOSTNAME = lanIpAddress;
  }
}

if (getHostMode(args) === 'localhost') {
  env.REACT_NATIVE_PACKAGER_HOSTNAME = '127.0.0.1';
}

printStartHint(args);

const child = spawn(process.execPath, [expoCli, ...args], {
  cwd: root,
  env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
