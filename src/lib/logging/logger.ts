/**
 * 📝 Structured Logging Utility
 * Provides environment-aware logging with JSON output for production
 * Includes audit logging for sensitive operations
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  // For audit logs
  action?: string;
  userId?: string;
}

const logLevels = {
  debug: 3,
  info: 2,
  warn: 1,
  error: 0,
} as const;

/**
 * Get current log level from environment
 * Defaults: production=info, development/testing=debug
 */
const getCurrentLogLevel = (): number => {
  const envLevel = process.env.LOG_LEVEL;

  if (envLevel && logLevels[envLevel as LogLevel] !== undefined) {
    return logLevels[envLevel as LogLevel];
  }

  // Default behavior
  const isProduction = process.env.NODE_ENV === "production" || process.env.APP_ENV === "production";
  return isProduction ? logLevels.info : logLevels.debug;
};

const currentLogLevel = getCurrentLogLevel();

/**
 * Format a single log entry as JSON
 */
const formatLogEntry = (
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
): string => {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (context) {
    entry.context = context;
  }

  return JSON.stringify(entry);
};

/**
 * Main logger object with environment-aware methods
 */
export const logger = {
  /**
   * Log error - always shown
   * @param message Error message
   * @param context Additional error context (never include sensitive data)
   */
  error: (message: string, context?: Record<string, any>): void => {
    const logEntry = formatLogEntry("error", message, context);
    console.error(logEntry);
  },

  /**
   * Log warning - shown in warn and above levels
   * @param message Warning message
   * @param context Additional context
   */
  warn: (message: string, context?: Record<string, any>): void => {
    if (currentLogLevel >= logLevels.warn) {
      const logEntry = formatLogEntry("warn", message, context);
      console.warn(logEntry);
    }
  },

  /**
   * Log info - shown in info and above levels
   * @param message Info message
   * @param context Additional context
   */
  info: (message: string, context?: Record<string, any>): void => {
    if (currentLogLevel >= logLevels.info) {
      const logEntry = formatLogEntry("info", message, context);
      console.info(logEntry);
    }
  },

  /**
   * Log debug - only shown in debug level (development)
   * @param message Debug message
   * @param context Additional context for debugging
   */
  debug: (message: string, context?: Record<string, any>): void => {
    if (currentLogLevel >= logLevels.debug) {
      const logEntry = formatLogEntry("debug", message, context);
      console.debug(logEntry);
    }
  },

  /**
   * Audit logging for sensitive operations
   * Always logged regardless of log level
   * Never logs sensitive data directly
   * @param action What action was performed (e.g., "LOGIN", "USER_CREATED", "PAYMENT")
   * @param userId User ID involved in the action
   * @param context Operation context (audit trail info only, no passwords/tokens)
   */
  audit: (
    action: string,
    userId: string | null | undefined,
    context?: Record<string, any>,
  ): void => {
    const entry: LogEntry & { action: string; userId: string | null | undefined } = {
      level: "info",
      message: `AUDIT: ${action}`,
      action,
      userId: userId || "anonymous",
      timestamp: new Date().toISOString(),
    };

    if (context) {
      entry.context = context;
    }

    console.info(JSON.stringify(entry));
  },

  /**
   * Contextual logging helper
   * Useful for logging with automatic context wrapping
   */
  withContext: (defaultContext: Record<string, any>) => ({
    error: (message: string, additionalContext?: Record<string, any>) =>
      logger.error(message, { ...defaultContext, ...additionalContext }),
    warn: (message: string, additionalContext?: Record<string, any>) =>
      logger.warn(message, { ...defaultContext, ...additionalContext }),
    info: (message: string, additionalContext?: Record<string, any>) =>
      logger.info(message, { ...defaultContext, ...additionalContext }),
    debug: (message: string, additionalContext?: Record<string, any>) =>
      logger.debug(message, { ...defaultContext, ...additionalContext }),
  }),

  /**
   * Performance logging helper
   * Logs execution time and success/failure
   */
  measureAsync: async <T,>(
    operationName: string,
    fn: () => Promise<T>,
    context?: Record<string, any>,
  ): Promise<T> => {
    const startTime = Date.now();
    const startEntry: LogEntry = {
      level: "debug",
      message: `[${operationName}] Starting`,
      context,
      timestamp: new Date().toISOString(),
    };
    console.debug(JSON.stringify(startEntry));

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      const successEntry: LogEntry = {
        level: "info",
        message: `[${operationName}] Completed in ${duration}ms`,
        context: { ...context, durationMs: duration },
        timestamp: new Date().toISOString(),
      };
      console.info(JSON.stringify(successEntry));

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const errorEntry: LogEntry = {
        level: "error",
        message: `[${operationName}] Failed after ${duration}ms: ${errorMessage}`,
        context: { ...context, durationMs: duration, error: errorMessage },
        timestamp: new Date().toISOString(),
      };
      console.error(JSON.stringify(errorEntry));

      throw error;
    }
  },

  /**
   * Performance logging helper (sync version)
   */
  measureSync: <T,>(
    operationName: string,
    fn: () => T,
    context?: Record<string, any>,
  ): T => {
    const startTime = Date.now();
    const startEntry: LogEntry = {
      level: "debug",
      message: `[${operationName}] Starting`,
      context,
      timestamp: new Date().toISOString(),
    };
    console.debug(JSON.stringify(startEntry));

    try {
      const result = fn();
      const duration = Date.now() - startTime;

      const successEntry: LogEntry = {
        level: "info",
        message: `[${operationName}] Completed in ${duration}ms`,
        context: { ...context, durationMs: duration },
        timestamp: new Date().toISOString(),
      };
      console.info(JSON.stringify(successEntry));

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      const errorEntry: LogEntry = {
        level: "error",
        message: `[${operationName}] Failed after ${duration}ms: ${errorMessage}`,
        context: { ...context, durationMs: duration, error: errorMessage },
        timestamp: new Date().toISOString(),
      };
      console.error(JSON.stringify(errorEntry));

      throw error;
    }
  },
};

/**
 * Export type for use in other modules
 */
export type Logger = typeof logger;
