const { ERROR_CODES } = require('../errors/errorCodes');

const PROVIDER_FAILURE_CODES = new Set([
  'AI_PROVIDER_NOT_CONFIGURED',
  ERROR_CODES.AI_PROVIDER_NOT_CONFIGURED,
  ERROR_CODES.AI_NOT_CONFIGURED,
  ERROR_CODES.AI_RUNTIME_DISABLED,
  ERROR_CODES.AI_AUTH_FAILED,
  ERROR_CODES.AI_RATE_LIMITED,
  'AI_PROVIDER_TIMEOUT',
  ERROR_CODES.AI_PROVIDER_TIMEOUT,
  ERROR_CODES.AI_TIMEOUT,
  ERROR_CODES.AI_CONTEXT_LIMIT,
  ERROR_CODES.AI_REQUEST_FAILED,
  ERROR_CODES.AI_PROVIDER_UNAVAILABLE,
  ERROR_CODES.AI_INVALID_RESPONSE,
  ERROR_CODES.AI_OUTPUT_BLOCKED,
]);

const PROVIDER_FAILURE_CONTRACT = {
  AI_PROVIDER_NOT_CONFIGURED: {
    code: ERROR_CODES.AI_NOT_CONFIGURED,
    status: 503,
    retryable: false,
    message: 'AI provider is not configured.',
    publicReason: 'provider_not_configured',
  },
  AI_NOT_CONFIGURED: {
    code: ERROR_CODES.AI_NOT_CONFIGURED,
    status: 503,
    retryable: false,
    message: 'AI provider is not configured.',
    publicReason: 'provider_not_configured',
  },
  AI_RUNTIME_DISABLED: {
    code: ERROR_CODES.AI_RUNTIME_DISABLED,
    status: 503,
    retryable: false,
    message: 'AI provider runtime is disabled.',
    publicReason: 'provider_runtime_disabled',
  },
  AI_AUTH_FAILED: {
    code: ERROR_CODES.AI_AUTH_FAILED,
    status: 503,
    retryable: false,
    message: 'AI provider authentication failed.',
    publicReason: 'provider_authentication_failed',
  },
  AI_RATE_LIMITED: {
    code: ERROR_CODES.AI_RATE_LIMITED,
    status: 429,
    retryable: true,
    message: 'AI provider is rate limited.',
    publicReason: 'provider_rate_limited',
  },
  AI_PROVIDER_TIMEOUT: {
    code: ERROR_CODES.AI_TIMEOUT,
    status: 504,
    retryable: true,
    message: 'AI provider timed out.',
    publicReason: 'provider_timeout',
  },
  AI_TIMEOUT: {
    code: ERROR_CODES.AI_TIMEOUT,
    status: 504,
    retryable: true,
    message: 'AI provider timed out.',
    publicReason: 'provider_timeout',
  },
  AI_CONTEXT_LIMIT: {
    code: ERROR_CODES.AI_CONTEXT_LIMIT,
    status: 413,
    retryable: false,
    message: 'AI provider context limit was reached.',
    publicReason: 'provider_context_limit',
  },
  AI_REQUEST_FAILED: {
    code: ERROR_CODES.AI_REQUEST_FAILED,
    status: 502,
    retryable: true,
    message: 'AI provider request failed.',
    publicReason: 'provider_request_failed',
  },
  AI_PROVIDER_UNAVAILABLE: {
    code: ERROR_CODES.AI_PROVIDER_UNAVAILABLE,
    status: 503,
    retryable: true,
    message: 'AI provider is unavailable.',
    publicReason: 'provider_unavailable',
  },
  AI_INVALID_RESPONSE: {
    code: ERROR_CODES.AI_INVALID_RESPONSE,
    status: 502,
    retryable: true,
    message: 'AI provider returned an invalid response.',
    publicReason: 'provider_invalid_response',
  },
  AI_OUTPUT_BLOCKED: {
    code: ERROR_CODES.AI_OUTPUT_BLOCKED,
    status: 422,
    retryable: false,
    message: 'AI provider output was blocked.',
    publicReason: 'provider_output_blocked',
  },
};

function providerFailureKey(error) {
  if (!error?.code) return ERROR_CODES.AI_REQUEST_FAILED;
  if (error.code === ERROR_CODES.AI_PROVIDER_NOT_CONFIGURED) return 'AI_PROVIDER_NOT_CONFIGURED';
  return error.code;
}

function isProviderFailureCode(code) {
  return PROVIDER_FAILURE_CODES.has(code);
}

function normalizeProviderFailure(error = {}) {
  const key = providerFailureKey(error);
  const contract = PROVIDER_FAILURE_CONTRACT[key] || PROVIDER_FAILURE_CONTRACT.AI_REQUEST_FAILED;
  return { ...contract };
}

module.exports = {
  isProviderFailureCode,
  normalizeProviderFailure,
};
