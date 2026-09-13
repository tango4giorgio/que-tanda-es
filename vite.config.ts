import { readFile } from 'node:fs/promises';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const STARTER_CATALOGUE_PATH = '/catalogue/starter-catalogue.json';

/**
 * During `vite dev` only, serve the local synthetic test catalogue in place of the real
 * archive.org starter catalogue, so local development always has short, clearly announced
 * clips available without depending on network access to archive.org. Production builds
 * (`vite build`/`vite preview`) are untouched and continue to bundle the real
 * `public/catalogue/starter-catalogue.json` archive.org catalogue as-is.
 */
function devTestCatalogue(): Plugin {
  return {
    name: 'dev-test-catalogue',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== STARTER_CATALOGUE_PATH) {
          next();
          return;
        }
        try {
          const body = await readFile('public/catalogue/test-catalogue.json', 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(body);
        } catch (error) {
          next(error as Error);
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    devTestCatalogue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['catalogue/starter-catalogue.json'],
      manifest: {
        name: 'Tango Track Guessing Game',
        short_name: 'Tango Guess',
        description: 'Guess the tango orchestra from a short music preview.',
        theme_color: '#201b2c',
        background_color: '#201b2c',
        display: 'standalone',
        start_url: '/',
        icons: []
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      }
    })
  ]
});
