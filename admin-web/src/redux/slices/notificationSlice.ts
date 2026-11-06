import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  items: NotificationItem[];
}

const initialState: NotificationState = {
  items: [
    {
      id: 'notif_1',
      type: 'info',
      message: 'New high priority lead assigned: Apex Solutions Ltd.',
      timestamp: new Date().toISOString(),
      read: false
    }
  ],
};

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<NotificationItem, 'id' | 'timestamp' | 'read'>>) => {
      state.items.unshift({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      });
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.id === action.payload);
      if (item) item.read = true;
    },
    clearAll: (state) => {
      state.items = [];
    }
  },
});

export const { addNotification, markAsRead, clearAll } = notificationSlice.actions;
export default notificationSlice.reducer;

