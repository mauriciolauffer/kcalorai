import { Hono } from 'hono';
import { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

app.get('/', (c) => {
  return c.text('kcalorai API Gateway');
});

export { app };
