import dotenv from 'dotenv';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
dotenv.config();

// Get the package.json version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version || '1.0.0';

// Define configuration schema with Zod
const ConfigSchema = z.object({
  version: z.string(),
  server: z.object({
    port: z.coerce.number().default(3000),
    host: z.string().default('localhost'),
  }),
  azureDevOps: z.object({
    organizationUrl: z.string().url().optional(),
    token: z.string().optional(),
    project: z.string().optional(),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    enableConsole: z.boolean().default(true),
  }),
});

// Type for the configuration
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  const config = {
    version,
    server: {
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
      host: process.env.HOST || 'localhost',
    },
    azureDevOps: {
      organizationUrl: process.env.AZURE_DEVOPS_ORG_URL,
      token: process.env.AZURE_DEVOPS_TOKEN,
      project: process.env.AZURE_DEVOPS_PROJECT,
    },
    logging: {
      level: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
      enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
    },
  };

  // Validate configuration
  return ConfigSchema.parse(config);
}

// Export a singleton instance of the configuration
export const config = loadConfig();
