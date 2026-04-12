function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const ENV = {
  PORT: requireEnv('PORT'),
  FRONTEND_URL: requireEnv('FRONTEND_URL'),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_TOKEN_EXPIRY: requireEnv('JWT_ACCESS_TOKEN_EXPIRY'),
  JWT_REFRESH_TOKEN_EXPIRY: requireEnv('JWT_REFRESH_TOKEN_EXPIRY'),
};
