import 'dotenv/config';

function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function parsePort(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  return parsed;
}

export const appConfig = {
  port: parsePort('PORT', 3001),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000'],
};

export const databaseConfig = {
  host: requiredEnv('DB_HOST'),
  user: requiredEnv('DB_USER'),
  password: optionalEnv('DB_PASS', ''),
  database: requiredEnv('DB_NAME'),
  port: parsePort('DB_PORT', 3306),
  connectionLimit: parsePort('DB_CONNECTION_LIMIT', 10),
};
