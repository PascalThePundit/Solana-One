import { Buffer } from 'buffer';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import process from 'process';

// Polyfill Buffer
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

// Polyfill process
if (typeof global.process === 'undefined') {
  global.process = process;
} else {
  const bProcess = require('process');
  for (const key in bProcess) {
    if (!(key in global.process)) {
      global.process[key] = bProcess[key];
    }
  }
}

// Ensure atob/btoa for some libraries
if (typeof global.atob === 'undefined') {
  global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}
if (typeof global.btoa === 'undefined') {
  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}
