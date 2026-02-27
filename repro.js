const path = require('path');
const absolutePath = path.resolve('metro.config.js');
console.log('Absolute path:', absolutePath);
try {
  const configModule = require(absolutePath);
  console.log('require() worked');
} catch (e) {
  console.log('require() failed:', e.message);
  (async () => {
    try {
      const configModule = await import(absolutePath);
      console.log('import() worked');
    } catch (err) {
      console.log('import() failed:', err.message);
      if (err.message.includes('file://')) {
        console.log('Confirmed: import() needs file:// URL on Windows');
      }
    }
  })();
}
