import axios from 'axios';
import React, { FC, ReactElement, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { DataSyncContext } from './data-sync-context';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getFromLocalForage, offlineChecklist, onlineChecklist } from './util';

import { sendRequest,syncOfflineRequests } from './api-helper';

// Check if window object exists
const hasWindow = () => {
  return typeof window !== 'undefined';
};

export const OfflineSyncProvider: FC<{
  children: ReactElement;
  render?: (status: { isOffline: boolean, isOnline: boolean }) => ReactNode;
  onStatusChange?: (status: { isOffline: boolean, isOnline: boolean }) => void;
}> = ({ children, render, onStatusChange }) => {
  
  // Manage state for data, offline status, and online status
  const [data, setData] = useState<Record<string, any>>({});
  const [isOffline, setIsOffline] = useState<boolean>(window.navigator.onLine ?? false);
  const [isOnline, setIsOnline] = useState<boolean>(window.navigator.onLine ?? true);

  // Add event listeners for online/offline events
  useEffect(() => {
    if (!hasWindow()) {
      return;
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);


    // Event handler for online event
  const handleOnline = useCallback(() => {
    setIsOffline(false);
    handleEvent(false);
    syncOfflineRequests()
  },[]);

  // Event handler for offline event
  const handleOffline = () => {
    setIsOffline(true);
    offlineChecklist();
    handleEvent(true);
  };

    // Sync online data when back online
  // const syncOnline = async () => {
  //   const appOffline = await getFromLocalForage('appOffline');
  //   if (appOffline && navigator.onLine) {
  //     onlineChecklist();
  //   }
  // };

  // useEffect(() => {
  //   syncOnline();
  // }, []);

   // Event handler for status change
  const handleEvent = (isOffline = true) => {
    const isOnline = !isOffline;
    onStatusChange?.({ isOffline, isOnline });
    setIsOffline(isOffline);
    setIsOnline(isOnline);
  };

   // Update data
  // const updateData = useCallback((newData: any) => {
  //   setData((prev: any) => ({ ...prev, ...newData }));
  // }, []);

    // Call API
  // const callApi = useCallback((payload: any) => {
  //   if (navigator.onLine) {
  //     const apiObject: RequestObject = {
  //       url: payload.url,
  //       ...omit(
  //         {
  //           method: payload.method,
  //           data: payload.body,
  //           headers: payload.headers,
  //           queryParams: payload.queryParams,
  //           baseURL: payload.baseURL,
  //           params: payload.params,
  //           timeout: payload.timeout,
  //           responseType: payload.responseType || 'json',
  //         },
  //         (value) => {
  //           return isNull(value);
  //         }
  //       ),
  //     };
  //     //@ts-ignore
  //     return axios.request(apiObject);
  //   } else {
  //     return new Promise((resolve) => {
  //       appendApi(payload);
  //       resolve('offline');
  //     });
  //   }
  // }, []);

  //  // Append API to offline sync data
  // const appendApi = useCallback(async (newApi: any) => {
  //   let offlineSyncData: any = (await getFromLocalForage('offlineSyncData')) || [];
  //   offlineSyncData = [...offlineSyncData, newApi];
  //   await setToLocalForage('offlineSyncData', offlineSyncData);
  //   toast.info('Your data will be synced when we are back online');
  // }, []);

  return (
    <DataSyncContext.Provider value={{ data, setData,sendRequest }}>
      {render?.({isOffline, isOnline})}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      {children}
    </DataSyncContext.Provider>
  );
};


// Custom hook to access offline sync context
export const useOfflineSyncContext = () => {
  return useContext(DataSyncContext);
};
