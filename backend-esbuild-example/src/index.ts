import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

app.get('/', (c) => {
  const message = process.env.MESSAGE || 'Hello from Hono!';
  return c.text(message);
});

app.get('/env', (c) => {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  return c.json({
    message: 'Environment variables accessed',
    DB_HOST: dbHost,
    DB_PORT: dbPort,
    NODE_ENV: process.env.NODE_ENV
  });
});

const port = Number(process.env.PORT) || 3000;

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
