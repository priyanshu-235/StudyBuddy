export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;

  if (typeof error === 'string') {
    const trimmed = error.replace(/^Error:\s*/i, '').trim();
    return trimmed || fallback;
  }

  const data = error.response?.data;

  if (typeof data === 'string') {
    const trimmed = data.replace(/^Error:\s*/i, '').trim();
    return trimmed || fallback;
  }

  if (data?.message) return data.message;
  if (data?.error) return data.error;

  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection and try again.';
  }

  if (error.message) return error.message;

  return fallback;
}
