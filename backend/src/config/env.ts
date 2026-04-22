function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const ENV = {
  PORT: requireEnv('PORT'),
  NODE_ENV: requireEnv('NODE_ENV'),
  FRONTEND_URL: requireEnv('FRONTEND_URL'),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_TOKEN_EXPIRY: requireEnv('JWT_ACCESS_TOKEN_EXPIRY'),
  JWT_REFRESH_TOKEN_EXPIRY: requireEnv('JWT_REFRESH_TOKEN_EXPIRY'),
  SMTP_HOST: requireEnv('SMTP_HOST'),
  SMTP_PORT: requireEnv('SMTP_PORT'),
  SMTP_USER: requireEnv('SMTP_USER'),
  SMTP_PASSWORD: requireEnv('SMTP_PASSWORD'),
  SMTP_FROM_EMAIL: requireEnv('SMTP_FROM_EMAIL'),
};
