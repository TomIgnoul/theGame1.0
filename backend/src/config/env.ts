function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function loadEnv() {
  return {
    DATABASE_URL: getEnv('DATABASE_URL'),
    ADMIN_API_KEY: getEnv('ADMIN_API_KEY'),
    PORT: Number(process.env.PORT) || 8080,
    GOOGLE_ROUTES_API_KEY: process.env.GOOGLE_ROUTES_API_KEY ?? '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  };
}
