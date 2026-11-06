import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MobileAlert {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface AlertState {
  alert: MobileAlert | null;
}

const initialState: AlertState = {
  alert: null,
};

export const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    showAlert: (state, action: PayloadAction<Omit<MobileAlert, 'id'>>) => {
      state.alert = {
        id: Math.random().toString(36).substring(2, 9),
        ...action.payload,
      };
    },
    dismissAlert: (state) => {
      state.alert = null;
    },
  },
});

export const { showAlert, dismissAlert } = alertSlice.actions;
export default alertSlice.reducer;

