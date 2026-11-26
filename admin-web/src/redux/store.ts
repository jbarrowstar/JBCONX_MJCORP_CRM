import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import notificationReducer from './slices/notificationSlice';
import toastReducer from './slices/toastSlice';
import { baseApi } from './services/baseApi';

export const createStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      notification: notificationReducer,
      toast: toastReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

export const store = createStore();

export type RootState = ReturnType<ReturnType<typeof createStore>['getState']>;
export type AppDispatch = typeof store.dispatch;

