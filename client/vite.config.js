import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        mfeCadastro: isProd
          ? '/mfe-cadastro/assets/remoteEntry.js'
          : 'http://localhost:3001/assets/remoteEntry.js',
        mfeOperacoes: isProd
          ? '/mfe-operacoes/assets/remoteEntry.js'
          : 'http://localhost:3002/assets/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
  },
});