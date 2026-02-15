import { Hono } from 'hono';
import typia from 'typia';
import { SignupRequest } from '../types/auth';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { Env } from '../types';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/signup', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const validation = typia.validate<SignupRequest>(body);

  if (!validation.success) {
    return c.json({
      error: 'Validation failed',
      details: validation.errors
    }, 400);
  }

  const data = validation.data;
  const userRepository = new UserRepository(c.env.DB);
  const authService = new AuthService(userRepository, c.env.JWT_SECRET);

  try {
    const response = await authService.signup(data);
    return c.json(response, 201);
  } catch (error: any) {
    if (error.message === 'Email already in use') {
      return c.json({ error: error.message }, 409);
    }
    return c.json({ error: error.message || 'Internal Server Error' }, 500);
  }
});

export { auth };
