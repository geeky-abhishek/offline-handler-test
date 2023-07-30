import axios from 'axios';

const axiosInstance = axios.create();

// Function to retry failed requests
const handleRetry = (error) => {
  const { config, response } = error;
  const { retry } = config;

  // Check if the request method is one of GET, POST, or PUT, and the status code is in the range of 500-599 (server error)
  if (
    response && response.status >= 500 && response.status < 600
  ) {
    // If the config does not have a "retry" option or the maximum number of retries has been reached, reject the promise
    if (!retry || retry <= 0) {
      return Promise.reject(error);
    }

    // Decrement the number of retries and return a new Axios instance to retry the request after an interval
    config.retry -= 1;
    const delay = new Promise((resolve) => setTimeout(resolve, 1000)); // Adjust the retry interval as needed (here, it's 1 second)
    return delay.then(() => axiosInstance(config));
  }

  // For other types of errors or non-retryable requests, reject the promise
  return Promise.reject(error);
};

// Attach the interceptor for failed requests
axiosInstance.interceptors.response.use(undefined, (error) => {
  return handleRetry(error);
});

export default axiosInstance;
