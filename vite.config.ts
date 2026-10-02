import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import { defineConfig, Plugin } from 'vite';
import { handleCuratorQuery, streamAdvisorChatServer } from './src/server/geminiService';

dotenv.config();

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/advisor/stream' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const { messages, enableSearchGrounding } = parsed;
              if (!Array.isArray(messages)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'messages array is required' }));
                return;
              }

              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');

              await streamAdvisorChatServer(
                messages,
                enableSearchGrounding !== false,
                (token) => {
                  res.write(`data: ${JSON.stringify({ token })}\n\n`);
                },
                (groundingMetadata) => {
                  res.write(`data: ${JSON.stringify({ groundingMetadata })}\n\n`);
                }
              );
              res.write('data: [DONE]\n\n');
              res.end();
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : String(err);
              console.error('Vite dev advisor stream error:', message);
              res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
              res.write('data: [DONE]\n\n');
              res.end();
            }
          });
          return;
        }

        if (req.url === '/api/curator' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body);
              const result = await handleCuratorQuery(parsed);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : String(err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

