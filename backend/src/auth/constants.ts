export const jwtConstants = {
  // Read at use time, not import time: ConfigModule loads .env after this file is imported.
  get secret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }
    return secret;
  },
};
