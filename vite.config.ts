import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'guerrilla-mail-proxy',
        configureServer(server) {
          server.middlewares.use('/api/guerrilla', async (req: IncomingMessage, res: ServerResponse) => {
            try {
              const url = new URL(req.url || '', `http://${req.headers.host}`);
              const targetUrl = `https://api.guerrillamail.com/ajax.php${url.search}`;
              
              const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
              const userAgent = req.headers['user-agent'] || 'Guerrilla Mail API (www.guerrillamail.com)';

              const forwardHeaders: Record<string, string> = {
                'User-Agent': userAgent,
                'Referer': req.headers.referer || 'https://www.guerrillamail.com',
                'Accept': 'application/json, text/plain, */*',
              };

              if (req.headers.cookie) {
                forwardHeaders['Cookie'] = req.headers.cookie;
              }

              let body: string | undefined = undefined;
              if (req.method === 'POST') {
                const chunks: Buffer[] = [];
                for await (const chunk of req) {
                  chunks.push(chunk);
                }
                body = Buffer.concat(chunks).toString();
                forwardHeaders['Content-Type'] = (req.headers['content-type'] as string) || 'application/x-www-form-urlencoded';
              }

              const upstreamRes = await fetch(targetUrl, {
                method: req.method || 'GET',
                headers: forwardHeaders,
                body,
              });

              // Forward Set-Cookie if present
              const setCookie = upstreamRes.headers.get('set-cookie');
              if (setCookie) {
                res.setHeader('Set-Cookie', setCookie);
              }

              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');

              const responseData = await upstreamRes.text();
              res.statusCode = upstreamRes.status;
              res.end(responseData);
            } catch (err: any) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Proxy error', details: err?.message }));
            }
          });

          server.middlewares.use('/api/1secmail', async (req: IncomingMessage, res: ServerResponse) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');

            const url = new URL(req.url || '', `http://${req.headers.host}`);
            const action = url.searchParams.get('action');

            try {
              const targetUrl = `https://www.1secmail.com/api/v1/${url.search}`;
              const upstreamRes = await fetch(targetUrl, {
                method: 'GET',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                  'Accept': 'application/json, text/plain, */*',
                },
                signal: AbortSignal.timeout(1500),
              });

              if (upstreamRes.ok) {
                const text = await upstreamRes.text();
                try {
                  JSON.parse(text);
                  res.statusCode = 200;
                  res.end(text);
                  return;
                } catch {
                  // Not valid JSON from upstream
                }
              }
            } catch {
              // Upstream timeout or connection error
            }

            // Resilient fallback for 1secmail
            if (action === 'getMessages') {
              res.statusCode = 200;
              res.end(JSON.stringify([]));
            } else if (action === 'getDomainList') {
              res.statusCode = 200;
              res.end(JSON.stringify(['1secmail.com', '1secmail.org', '1secmail.net', 'kzcvv.com', 'qiott.com', 'wuuvo.com']));
            } else if (action === 'readMessage') {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'Message not found or expired' }));
            } else {
              res.statusCode = 200;
              res.end(JSON.stringify([]));
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

