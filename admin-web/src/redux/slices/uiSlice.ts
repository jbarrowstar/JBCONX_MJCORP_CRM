import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '@shared/constants/themes';

interface UiState {
  /** Desktop: expanded sidebar (true) or compact icon rail (false). */
  sidebarOpen: boolean;
  /** Small screens: off-canvas navigation drawer visibility. */
  mobileNavOpen: boolean;
  /** The CRM ships a single brand theme (Executive Sapphire). */
  theme: ThemeMode;
}

const initialState: UiState = {
  sidebarOpen: true,
  mobileNavOpen: false,
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
    setMobileNavOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileNavOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setMobileNavOpen, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
