const crypto = require('crypto');
const {
  normalizeSourceCode,
  normalizeStdin,
} = require('./normalizeExecutionInput');

class HashGenerationError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'HashGenerationError';
    this.cause = cause;
  }
}

function generateExecutionHash(languageId, sourceCode, stdin) {
  try {
    const normalizedCode = normalizeSourceCode(sourceCode);
    const normalizedStdin = normalizeStdin(stdin);
    const payload = `${languageId}${normalizedCode}${normalizedStdin}`;

    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  } catch (error) {
    throw new HashGenerationError('Failed to generate execution hash', error);
  }
}

module.exports = {
  generateExecutionHash,
  HashGenerationError,
};
