import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["favicon.ico", "robots.txt", "pwa-icons/*.png"],

      devOptions: {
        enabled: false,
      },

      manifest: {
        name: "EnerGum - SnackBar Energi",
        short_name: "EnerGum",
        description:
          "EnerGum - Snack energi dengan ekstrak kacang alami untuk meningkatkan fokus dan energi Anda",

        theme_color: "#5C4033",
        background_color: "#F5F0E6",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",

        // ✅ ICONS — DIPISAH ANY & MASKABLE
        icons: [
          {
            src: "/pwa-icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-icons/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/pwa-icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],

        screenshots: [
          {
            src: "/screenshots/home.png",
            sizes: "1080x1920",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },

          {
            urlPattern: /\/api\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
