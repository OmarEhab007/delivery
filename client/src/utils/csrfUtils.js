import { getCsrfToken } from '../api/api';

/**
 * Initialize CSRF token
 * This function should be called when the app starts
 * or before making any CSRF-protected requests
 */
export const initCsrfToken = async () => {
  try {
    const token = await getCsrfToken();
    return token;
  } catch (error) {
    console.error('Failed to initialize CSRF token:', error);
    return null;
  }
};

/**
 * Helper function to ensure a CSRF token is available before making a protected request
 * @param {Function} apiCall - The API function to call after ensuring CSRF token
 * @param {...any} args - Arguments to pass to the API function
 */
export const withCsrfToken = async (apiCall, ...args) => {
  try {
    // First ensure we have a CSRF token
    await initCsrfToken();
    // Then make the API call
    return await apiCall(...args);
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}; 