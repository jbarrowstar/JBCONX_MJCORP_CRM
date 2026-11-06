import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '@shared/constants/themes';

interface UiState {
  activeTab: string;
  theme: ThemeMode;
}

const initialState: UiState = {
  activeTab: 'dashboard',
  theme: 'classic-blue',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
  },
});

export const { setActiveTab, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
