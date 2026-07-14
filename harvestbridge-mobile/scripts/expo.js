#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const expoCli = path.join(root, 'node_modules', 'expo', 'bin', 'cli');

const env = {
  ...process.env,
  EXPO_HOME: process.env.EXPO_HOME || path.join(root, '.expo-home'),
  npm_config_cache: process.env.npm_config_cache || path.join(root, '.npm-cache'),
};

const child = spawn(process.execPath, [expoCli, ...process.argv.slice(2)], {
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
