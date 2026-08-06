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

  // Handle new backend error format with message field
  if (data?.message) return data.message;
  
  // Handle old backend error format with error field
  if (data?.error) return data.error;

  // Handle HTTP status codes
  if (error.response?.status === 409) {
    return data?.message || 'This resource already exists';
  }
  
  if (error.response?.status === 401) {
    return 'Authentication required. Please login again.';
  }
  
  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.response?.status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (error.response?.status === 500) {
    return 'Server error. Please try again later.';
  }
  
  if (error.response?.status === 429) {
    const retryAfter = data?.retryAfterSeconds;
    const base =
      data?.message ||
      'You are running code too frequently. Please wait and try again.';
    return retryAfter ? `${base}` : base;
  }

  if (error.response?.status === 503) {
    return data?.message || 'Service temporarily unavailable. Please try again later.';
  }

  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection and try again.';
  }

  if (error.message) return error.message;

  return fallback;
}
