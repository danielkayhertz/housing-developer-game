// Static SPA build config for the danielkayhertz.com/developergame/ snapshot.
// Mirrors the Chicagoland Explorer pattern: react + tailwind, no Cloudflare Workers plugin.
// Build with: npx vite build --config vite.config.static.ts --base /developergame/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
