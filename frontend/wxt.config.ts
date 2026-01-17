import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    action: {
      default_title: 'Dolphin',
    },
    permissions: ['activeTab'],
    web_accessible_resources: [
      {
        resources: ['iruka.webp'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
