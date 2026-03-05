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

// Polyfill Event and CustomEvent for @solana-mobile/wallet-standard-mobile
if (typeof global.Event === 'undefined') {
  global.Event = class Event {
    constructor(type) {
      this.type = type;
    }
  };
}
if (typeof global.CustomEvent === 'undefined') {
  global.CustomEvent = class CustomEvent extends global.Event {
    constructor(type, params) {
      super(type);
      this.detail = params ? params.detail : undefined;
    }
  };
}

// Polyfill TextEncoder and TextDecoder for Solana and Cloud Sync
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(string) {
      return Buffer.from(string, 'utf8');
    }
  };
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(buffer) {
      return Buffer.from(buffer).toString('utf8');
    }
  };
}
