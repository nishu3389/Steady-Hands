import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// DeviceOrientationEvent (real device tilt) is blocked entirely by mobile
// browsers on insecure origins over the network -- only `localhost` itself is
// exempt. Testing on a phone at http://<lan-ip>:3000 silently gets zero
// orientation events, which reads as "tilt does nothing" even though the
// listener code is correct. Serving over HTTPS (self-signed, same cert as
// WaterBowlProject's local dev server) fixes that for LAN testing.
const keyPath = path.resolve(__dirname, 'key.pem');
const certPath = path.resolve(__dirname, 'cert.pem');
const hasCert = fs.existsSync(keyPath) && fs.existsSync(certPath);

export default defineConfig(() => {
  return {
    // Default build target is Capacitor (the Android app), which serves
    // this bundle from its own local root — so base stays '/' here. GitHub
    // Pages serves the repo from /Steady-Hands/ instead; use
    // `npm run build:gh-pages` (sets DEPLOY_TARGET=gh-pages) for that build.
    base: process.env.DEPLOY_TARGET === 'gh-pages' ? '/Steady-Hands/' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      https: hasCert
        ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
        : undefined,
    },
  };
});
