import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  devToolbar: {
    enabled: false,
  },
  // Match the existing static file layout (index.html, energo.html) so
  // vercel.json's cleanUrls:true continues to serve /energo without a
  // trailing slash, exactly as it does today.
  build: {
    format: 'file',
  },
});
