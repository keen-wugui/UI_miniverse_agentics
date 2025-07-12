// Logging configuration for the application
export interface LoggingConfig {
  level: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  enableConsole: boolean;
  enableFile: boolean;
  enablePretty: boolean;
  redactPaths: string[];
  service: string;
  version: string;
}

export interface EnvironmentLoggingConfig {
  development: LoggingConfig;
  test: LoggingConfig;
  staging: LoggingConfig;
  production: LoggingConfig;
}

// Sensitive data paths to redact from logs
const REDACT_PATHS = [
  "password",
  "token",
  "secret",
  "key",
  "authorization",
  "cookie",
  "apiKey",
  "accessToken",
  "refreshToken",
  "credentials",
  "auth.password",
  "auth.token",
  "headers.authorization",
  "headers.cookie",
  "body.password",
  "body.token",
  "context.password",
  "context.token",
];

// Environment-specific logging configurations
export const loggingConfig: EnvironmentLoggingConfig = {
  development: {
    level: "debug",
    enableConsole: true,
    enableFile: false,
    enablePretty: true,
    redactPaths: REDACT_PATHS,
    service: "ui-miniverse-agentics",
    version: process.env.npm_package_version || "0.1.0",
  },
  test: {
    level: "warn",
    enableConsole: false,
    enableFile: false,
    enablePretty: false,
    redactPaths: REDACT_PATHS,
    service: "ui-miniverse-agentics",
    version: process.env.npm_package_version || "0.1.0",
  },
  staging: {
    level: "info",
    enableConsole: true,
    enableFile: true,
    enablePretty: false,
    redactPaths: REDACT_PATHS,
    service: "ui-miniverse-agentics",
    version: process.env.npm_package_version || "0.1.0",
  },
  production: {
    level: "warn",
    enableConsole: false,
    enableFile: true,
    enablePretty: false,
    redactPaths: REDACT_PATHS,
    service: "ui-miniverse-agentics",
    version: process.env.npm_package_version || "0.1.0",
  },
};

// Get current environment
export function getCurrentEnvironment(): keyof EnvironmentLoggingConfig {
  const env = process.env.NODE_ENV;
  
  if (env === "production") return "production";
  if (env === "test") return "test";
  if (env === "staging") return "staging";
  return "development";
}

// Get logging config for current environment
export function getCurrentLoggingConfig(): LoggingConfig {
  const environment = getCurrentEnvironment();
  return loggingConfig[environment];
}

// Performance logging thresholds
export const PERFORMANCE_THRESHOLDS = {
  API_SLOW_REQUEST: 2000, // 2 seconds
  API_VERY_SLOW_REQUEST: 5000, // 5 seconds
  COMPONENT_RENDER_SLOW: 100, // 100ms
  COMPONENT_RENDER_VERY_SLOW: 500, // 500ms
} as const;

// Log contexts for different parts of the application
export const LOG_CONTEXTS = {
  API: "api",
  AUTH: "auth",
  UI: "ui",
  ERROR: "error",
  PERFORMANCE: "performance",
  BUSINESS_LOGIC: "business",
  SYSTEM: "system",
} as const;

export type LogContext = (typeof LOG_CONTEXTS)[keyof typeof LOG_CONTEXTS];