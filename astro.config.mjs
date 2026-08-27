import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  devToolbar: {
    enabled: false,
  },
  // Match the existing static file layout (index.html, work/energo.html)
  // so vercel.json's cleanUrls:true continues to serve routes without a
  // trailing slash, exactly as it does today.
  build: {
    format: 'file',
  },
});
