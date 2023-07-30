import axios from 'axios';
import localForage from 'localforage';

const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 1000;
const API_REQUESTS_STORAGE_KEY = 'apiRequests';

const api = axios.create();

// Function to save a failed request to offline storage
// const saveRequestToOfflineStorage = async (config:any) => {
//   const requestKey = // Generate a unique key for the request, e.g., using request URL and method
//   await localForage.setItem(requestKey, config);
// };

// Function to save a failed request to offline storage
export const saveRequestToOfflineStorage = async (config:any) => {
  try {
    const storedRequests:Array<any> = (await localForage.getItem(API_REQUESTS_STORAGE_KEY)) || [];
    storedRequests.push(config);
    await localForage.setItem(API_REQUESTS_STORAGE_KEY, storedRequests);
  } catch (error) {
    console.error('Error saving API request for offline:', error);
  }
};



export const getStoredRequests = async () => {
  try {
    return await localForage.getItem(API_REQUESTS_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting stored API requests:', error);
    return [];
  }
};

export const clearStoredRequests = async () => {
  try {
    await localForage.removeItem(API_REQUESTS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing stored API requests:', error);
  }
};
// Function to perform the actual API request and handle retries
const performRequest = async (config:any):Promise<any> => {
  try {
    const response = await api.request(config);
    return response.data;
  } catch (error) {
    if (config.retryCount < RETRY_LIMIT) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      config.retryCount++;
      return performRequest(config);
    } else {
      // Retry limit reached, save the request to offline storage
      await saveRequestToOfflineStorage(config);
      throw new Error('Exceeded retry limit, request saved for offline sync.');
    }
  }
};

// Function to send the requests to the server and handle offline sync
export const sendRequest = async (config:any) => {
  try {
    // Add custom headers here if needed
    // config.headers = { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' };

    // Set the initial retry count to 0
    config.retryCount = 0;

    // Perform the API request and handle retries
    return await performRequest(config);
  } catch (error) {
    throw error;
  }
};

// Function to handle offline sync (call this when the user is online again)
// export const syncOfflineRequests = async () => {
//   const keys = await localForage.keys();
//   for (const key of keys) {
//     const config = await localForage.getItem(key);
//     if (config) {
//       await localForage.removeItem(key);
//       try {
//         await performRequest(config);
//       } catch (error) {
//         // Handle failed sync if needed
//       }
//     }
//   }
// };

export const syncOfflineRequests = async () => {
  const storedRequests:any = await getStoredRequests();
  if (!storedRequests || storedRequests.length === 0) {
    return;
  }

  for (const request of storedRequests) {
    
    if (request) {
      // await localForage.removeItem(key);
      storedRequests.splice(storedRequests.indexOf(request), 1);
      await localForage.setItem(API_REQUESTS_STORAGE_KEY, storedRequests);
      try {
        await performRequest(request);
      } catch (error) {
        // Handle failed sync if needed
      }
    }
  }
};

