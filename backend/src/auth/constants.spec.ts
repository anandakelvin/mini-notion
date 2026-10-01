import { jwtConstants } from './constants';

describe('jwtConstants.secret', () => {
  const original = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = original;
  });

  it('comes from the JWT_SECRET env variable', () => {
    process.env.JWT_SECRET = 'from-env';
    expect(jwtConstants.secret).toBe('from-env');
  });

  it('throws when JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    expect(() => jwtConstants.secret).toThrow('JWT_SECRET is not set');
  });
});
