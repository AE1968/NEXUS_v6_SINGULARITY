/**
 * 🛡️ NEXUS ERROR HANDLER UTILITY v7.0
 * Centralized error handling to eliminate code duplication
 */

const ErrorHandler = {
    /**
     * Handle API errors with fallback message
     * @param {Promise} promise - The promise to handle
     * @param {string} context - Error context for logging
     * @param {string} fallbackMessage - Message to speak on error
     * @returns {Promise<any|null>} Result or null on error
     */
    handleAPIError: async function (promise, context, fallbackMessage) {
        try {
            return await promise;
        } catch (error) {
            this.logError(context, error);

            if (window.NexusVoice && fallbackMessage) {
                window.NexusVoice.speak(fallbackMessage);
            }

            return null;
        }
    },

    /**
     * Log error with timestamp and context
     * @param {string} context - Error context
     * @param {Error} error - Error object
     */
    logError: function (context, error) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [${context}]:`, error);

        // Could send to analytics/Sentry here
        if (window.sentry) {
            window.sentry.captureException(error, { tags: { context } });
        }
    },

    /**
     * Handle user-facing errors with friendly messages
     * @param {string} technicalError - Technical error message
     * @returns {string} User-friendly error message
     */
    getUserFriendlyMessage: function (technicalError) {
        const errorMap = {
            'NetworkError': 'Connection lost. Please check your internet.',
            'TimeoutError': 'Request timed out. Please try again.',
            'AuthenticationError': 'Authentication failed. Please relogin.',
            'ValidationError': 'Invalid input. Please check your data.',
        };

        for (const [key, message] of Object.entries(errorMap)) {
            if (technicalError.includes(key)) {
                return message;
            }
        }

        return 'An unexpected error occurred. Please try again.';
    },

    /**
     * Retry failed operation with exponential backoff
     * @param {Function} fn - Function to retry
     * @param {number} maxRetries - Maximum retry attempts
     * @param {number} delay - Initial delay in ms
     * @returns {Promise<any>} Result of successful attempt
     */
    retryWithBackoff: async function (fn, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                this.logError('Retry', `Attempt ${i + 1} failed, retrying...`);
            }
        }
    }
};

window.ErrorHandler = ErrorHandler;
