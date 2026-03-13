/**
 * Exponential Backoff Retry Utility for Supabase Queries
 *
 * Features:
 * - Configurable retry limits and delays
 * - Intelligent error type classification
 * - Exponential backoff with jitter
 * - Error threshold detection
 * - Detailed retry metrics and logging
 */

// Default configuration from environment variables
const DEFAULT_CONFIG = {
    maxRetries: parseInt(import.meta.env?.VITE_RETRY_MAX_ATTEMPTS) || 3,
    initialDelay: parseInt(import.meta.env?.VITE_RETRY_INITIAL_DELAY_MS) || 1000,
    maxDelay: parseInt(import.meta.env?.VITE_RETRY_MAX_DELAY_MS) || 10000,
    backoffMultiplier: parseFloat(import.meta.env?.VITE_RETRY_BACKOFF_MULTIPLIER) || 2,
    jitterEnabled: import.meta.env?.VITE_RETRY_JITTER_ENABLED !== "false",
    errorThreshold: parseInt(import.meta.env?.VITE_RETRY_ERROR_THRESHOLD) || 5,
    thresholdWindowMs: parseInt(import.meta.env?.VITE_RETRY_THRESHOLD_WINDOW_MS) || 60000,
};

/**
 * Classify error types for intelligent retry decisions
 */
export const ErrorType = {
    NETWORK: "network",
    TIMEOUT: "timeout",
    RATE_LIMIT: "rate_limit",
    SERVER: "server",
    AUTH: "auth",
    SCHEMA: "schema",
    VALIDATION: "validation",
    UNKNOWN: "unknown",
};

// Error tracking for threshold detection
const errorTracker = {
    errors: [],

    addError(errorType, context) {
        // PHASE 1 FIX: Exclude timeout/abort errors from threshold tracking
        // These errors indicate slow connections, not actual failures
        // Counting them causes the system to stop retrying after 5 timeouts
        if (
            errorType === ErrorType?.TIMEOUT ||
            errorType === "abort" ||
            errorType === "AbortError"|| context?.message?.includes("aborted") ||
            context?.message?.includes("timeout")
        ) {
            console.log(
                `[ErrorTracker] Ignoring ${errorType} error for threshold tracking (slow connection, not failure)`,
            );
            return;
        }

        const now = Date.now();
        this.errors?.push({ errorType, context, timestamp: now });

        // Clean up old errors outside the threshold window
        this.errors = this.errors?.filter((err) => now - err?.timestamp < DEFAULT_CONFIG?.thresholdWindowMs);

        console.log(`[ErrorTracker] Added error. Count: ${this.errors?.length}/${DEFAULT_CONFIG?.errorThreshold}`);
    },

    getRecentErrorCount() {
        const now = Date.now();
        return this.errors?.filter((err) => now - err?.timestamp < DEFAULT_CONFIG?.thresholdWindowMs)?.length;
    },

    isThresholdExceeded() {
        // Always return false — threshold-based blocking causes all services to fail
        // when any single table/query accumulates errors. We track for logging only.
        return false;
    },

    reset() {
        this.errors = [];
    },
};

/**
 * Determine if an error is retryable
 */
const isRetryableError = (error, errorType) => {
    // Never retry these error types
    const nonRetryableTypes = [ErrorType?.SCHEMA, ErrorType?.VALIDATION, ErrorType?.AUTH];

    if (nonRetryableTypes?.includes(errorType)) {
        return false;
    }

    // Check for specific non-retryable error codes
    if (error?.code) {
        const code = error?.code?.toString();
        // PostgreSQL error classes that shouldn't be retried
        const nonRetryableClasses = ["22", "23", "42"]; // Data exception, integrity violation, syntax error
        if (nonRetryableClasses?.some((cls) => code?.startsWith(cls))) {
            return false;
        }
    }

    return true;
};

/**
 * Classify error based on error object properties and message
 */
export const classifyError = (error) => {
    if (!error) return ErrorType?.UNKNOWN;

    // CRITICAL FIX: Detect AbortError early
    if (error?.name === "AbortError" || error?.message?.includes("aborted") || error?.message?.includes("abort")) {
        return "abort"; // Special type that won't be tracked
    }

    // Check if error already has a category
    if (error?.category) {
        const categoryMap = {
            network: ErrorType?.NETWORK,
            timeout: ErrorType?.TIMEOUT,
            auth: ErrorType?.AUTH,
            schema: ErrorType?.SCHEMA,
        };
        return categoryMap?.[error?.category] || ErrorType?.UNKNOWN;
    }

    const errorMessage = error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || "";
    const errorCode = error?.code?.toString() || "";

    // Network errors
    if (
        /failed to fetch|network error|connection refused|fetch.*failed|network.*request.*failed/i?.test(
            errorMessage,
        ) ||
        errorCode === "ECONNREFUSED" ||
        errorCode === "ENOTFOUND"
    ) {
        return ErrorType?.NETWORK;
    }

    // Timeout errors
    if (/timeout|timed out|aborted/i?.test(errorMessage) || errorCode === "ETIMEDOUT" || errorCode === "ECONNABORTED") {
        return ErrorType?.TIMEOUT;
    }

    // Rate limit errors
    if (
        /rate limit|too many requests|quota exceeded/i?.test(errorMessage) ||
        error?.status === 429 ||
        errorCode === "429"
    ) {
        return ErrorType?.RATE_LIMIT;
    }

    // Server errors (5xx)
    if (
        /server error|internal server|service unavailable|bad gateway/i?.test(errorMessage) ||
        (error?.status >= 500 && error?.status < 600)
    ) {
        return ErrorType?.SERVER;
    }

    // Authentication errors
    if (
        /unauthorized|not authenticated|invalid.*token|expired.*token|authentication.*failed/i?.test(errorMessage) ||
        error?.status === 401 ||
        errorCode === "PGRST301"
    ) {
        return ErrorType?.AUTH;
    }

    // Schema errors (PostgreSQL class 42)
    if (
        /relation.*does not exist|column.*does not exist|function.*does not exist|syntax error|type.*does not exist/i?.test(
            errorMessage,
        ) ||
        errorCode?.startsWith("42")
    ) {
        return ErrorType?.SCHEMA;
    }

    // Validation errors (PostgreSQL class 22, 23)
    if (
        /invalid.*input|constraint.*violation|foreign key|unique.*violation|check.*constraint/i?.test(errorMessage) ||
        errorCode?.startsWith("22") ||
        errorCode?.startsWith("23")
    ) {
        return ErrorType?.VALIDATION;
    }

    return ErrorType?.UNKNOWN;
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
const calculateDelay = (attempt, config) => {
    const exponentialDelay = Math.min(
        config?.initialDelay * Math.pow(config?.backoffMultiplier, attempt),
        config?.maxDelay,
    );

    if (!config?.jitterEnabled) {
        return exponentialDelay;
    }

    // Add jitter (randomness) to prevent thundering herd
    const jitter = Math.random() * exponentialDelay * 0.3; // 0-30% jitter
    return Math.floor(exponentialDelay + jitter);
};

/**
 * Sleep utility
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Enhanced error with retry metadata
 */
class RetryError extends Error {
    constructor(message, originalError, metadata) {
        super(message);
        this.name = "RetryError";
        this.originalError = originalError;
        this.metadata = metadata;
        this.category = originalError?.category;
    }
}

/**
 * Main retry function with exponential backoff
 *
 * @param {Function} operation - Async function to retry
 * @param {Object} options - Configuration options
 * @param {string} options.context - Context description for logging
 * @param {number} options.maxRetries - Maximum retry attempts
 * @param {number} options.initialDelay - Initial delay in ms
 * @param {number} options.maxDelay - Maximum delay in ms
 * @param {number} options.backoffMultiplier - Backoff multiplier
 * @param {boolean} options.jitterEnabled - Enable jitter
 * @param {Function} options.onRetry - Callback on retry attempt
 * @returns {Promise} - Result of the operation
 */
export const retryWithBackoff = async (operation, options = {}) => {
    const config = {
        ...DEFAULT_CONFIG,
        ...options,
    };

    const context = config?.context || "unknown operation";
    let lastError = null;
    const retryMetadata = {
        attempts: 0,
        totalDelay: 0,
        errors: [],
        startTime: Date.now(),
    };

    // Check if error threshold is exceeded
    if (errorTracker?.isThresholdExceeded()) {
        console.warn(
            `[Retry] Error threshold exceeded (${errorTracker?.getRecentErrorCount()}/${DEFAULT_CONFIG?.errorThreshold} in ${DEFAULT_CONFIG?.thresholdWindowMs}ms) for: ${context}. Proceeding anyway.`,
        );
        // NOTE: We intentionally do NOT throw here. Throwing would block ALL queries
        // across the entire app whenever any single table/service accumulates 5 errors.
        // Instead, we just warn and let the operation proceed normally.
    }

    for (let attempt = 0; attempt <= config?.maxRetries; attempt++) {
        retryMetadata.attempts = attempt + 1;

        try {
            const result = await operation();

            // Success - log metrics if retries occurred
            if (attempt > 0) {
                const duration = Date.now() - retryMetadata?.startTime;
                console.info(`[Retry] Success after ${attempt} retries for ${context} (${duration}ms total)`);
            }

            return result;
        } catch (error) {
            lastError = error;
            const errorType = classifyError(error);

            retryMetadata?.errors?.push({
                attempt: attempt + 1,
                errorType,
                message: error?.message,
                code: error?.code,
            });

            // CRITICAL FIX: Only track error for threshold if this is the FINAL attempt
            // Don't count errors that will be retried
            const isFinalAttempt = attempt >= config?.maxRetries;
            const isNonRetryable = !isRetryableError(error, errorType);

            // Track error only if: final attempt OR non-retryable error
            if (isFinalAttempt || isNonRetryable) {
                errorTracker?.addError(errorType, context);
            }

            // Check if error is retryable
            if (isNonRetryable) {
                console.warn(`[Retry] Non-retryable error (${errorType}) for ${context}:`, error?.message);
                throw error;
            }

            // Check if we've exhausted retries
            if (isFinalAttempt) {
                console.error(`[Retry] Max retries (${config?.maxRetries}) exceeded for ${context}`, retryMetadata);
                throw new RetryError(
                    `Operation failed after ${config.maxRetries} retries: ${error?.message}`,
                    error,
                    retryMetadata,
                );
            }

            // Calculate delay and wait
            const delay = calculateDelay(attempt, config);
            retryMetadata.totalDelay += delay;

            console.warn(
                `[Retry] Attempt ${attempt + 1}/${config?.maxRetries + 1} failed for ${context} (${errorType}). Retrying in ${delay}ms...`,
            );

            // Call onRetry callback if provided
            if (config?.onRetry) {
                config?.onRetry({
                    attempt: attempt + 1,
                    maxRetries: config?.maxRetries,
                    error,
                    errorType,
                    delay,
                    context,
                });
            }

            await sleep(delay);
        }
    }

    // This should never be reached, but just in case
    throw new RetryError(`Operation failed: ${lastError?.message}`, lastError, retryMetadata);
};

/**
 * Wrap a Supabase query with retry logic
 *
 * @param {Function} queryFn - Supabase query function
 * @param {string} context - Context description
 * @param {Object} options - Additional retry options
 * @returns {Promise} - Query result
 */
export const withRetry = async (queryFn, context, options = {}) => {
    return retryWithBackoff(queryFn, {
        context,
        ...options,
    });
};

/**
 * Get current error tracker statistics
 */
export const getErrorStats = () => {
    return {
        recentErrorCount: errorTracker?.getRecentErrorCount(),
        thresholdExceeded: errorTracker?.isThresholdExceeded(),
        threshold: DEFAULT_CONFIG?.errorThreshold,
        windowMs: DEFAULT_CONFIG?.thresholdWindowMs,
        errors: errorTracker?.errors?.map((err) => ({
            errorType: err?.errorType,
            context: err?.context,
            timestamp: err?.timestamp,
        })),
    };
};

/**
 * Reset error tracker (useful for testing or manual reset)
 */
export const resetErrorTracker = () => {
    errorTracker?.reset();
};

/**
 * Get current retry configuration
 */
export const getRetryConfig = () => ({ ...DEFAULT_CONFIG });

export default retryWithBackoff;
