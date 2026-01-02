import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: number;
  MONGO_URI: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  JWT_SECRET: string;
  OPENAI_API_KEY: string;
  LLM_PROVIDER: string;
  LLM_MODEL: string;
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvVarOptional(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const env: EnvConfig = {
  PORT: parseInt(getEnvVarOptional('PORT', '4000'), 10),
  MONGO_URI: getEnvVar('MONGO_URI'),
  GOOGLE_CLIENT_ID: getEnvVar('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getEnvVar('GOOGLE_CLIENT_SECRET'),
  GOOGLE_REDIRECT_URI: getEnvVar('GOOGLE_REDIRECT_URI'),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY'),
  LLM_PROVIDER: getEnvVarOptional('LLM_PROVIDER', 'openai'),
  LLM_MODEL: getEnvVarOptional('LLM_MODEL', 'gpt-4o-mini'),
};

