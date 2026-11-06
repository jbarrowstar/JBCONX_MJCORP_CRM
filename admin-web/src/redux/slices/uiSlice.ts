import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '@shared/constants/themes';

interface UiState {
  sidebarOpen: boolean;
  theme: ThemeMode;
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: 'classic-blue',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
