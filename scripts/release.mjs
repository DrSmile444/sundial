#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

function currentRelease() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

process.stdout.write(`${currentRelease()}\n`);
