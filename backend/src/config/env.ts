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
  RESEND_API_KEY: requireEnv('RESEND_API_KEY'),
  RESEND_FROM_EMAIL: requireEnv('RESEND_FROM_EMAIL'),
  CLOUDINARY_CLOUD_NAME: requireEnv('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: requireEnv('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: requireEnv('CLOUDINARY_API_SECRET'),
};
