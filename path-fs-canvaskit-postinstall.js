const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'node_modules', 'canvaskit-wasm', 'package.json');

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.browser = {
    ...packageJson.browser,
    fs: false,
    path: false,
    os: false,
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('Successfully patched canvaskit-wasm/package.json');
} else {
  console.warn('canvaskit-wasm/package.json not found. Skipping patch.');
}
