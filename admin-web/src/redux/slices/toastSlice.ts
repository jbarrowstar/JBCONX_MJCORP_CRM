import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

let counter = 0;

export const toastSlice = createSlice({
  name: 'toast',
  initialState: { items: [] as Toast[] },
  reducers: {
    pushToast: {
      reducer: (state, action: PayloadAction<Toast>) => {
        state.items.push(action.payload);
      },
      prepare: (type: Toast['type'], message: string) => ({
        payload: { id: `t${++counter}`, type, message },
      }),
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
  },
});

export const { pushToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;
