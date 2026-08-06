function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function normalizeSourceCode(sourceCode) {
  if (typeof sourceCode !== 'string') {
    throw new TypeError('source_code must be a string');
  }

  return normalizeLineEndings(sourceCode).replace(/[ \t]+$/gm, '');
}

function normalizeStdin(stdin) {
  if (stdin == null) {
    return '';
  }

  return normalizeLineEndings(String(stdin)).replace(/[ \t]+$/gm, '');
}

module.exports = {
  normalizeLineEndings,
  normalizeSourceCode,
  normalizeStdin,
};
