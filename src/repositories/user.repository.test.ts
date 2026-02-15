import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRepository } from './user.repository';

describe('UserRepository', () => {
  let db: any;
  let repository: UserRepository;

  beforeEach(() => {
    db = {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      first: vi.fn(),
    };
    repository = new UserRepository(db);
  });

  it('should create a user', async () => {
    const user = { id: '1', email: 'test@example.com', password_hash: 'hash' };
    db.first.mockResolvedValue({ ...user, created_at: 'now', updated_at: 'now' });

    const result = await repository.create(user);

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'));
    expect(db.bind).toHaveBeenCalledWith(user.id, user.email, user.password_hash);
    expect(result.email).toBe(user.email);
  });

  it('should find a user by email', async () => {
    const email = 'test@example.com';
    db.first.mockResolvedValue({ id: '1', email });

    const result = await repository.findByEmail(email);

    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM users WHERE email = ?'));
    expect(db.bind).toHaveBeenCalledWith(email);
    expect(result?.email).toBe(email);
  });
});
