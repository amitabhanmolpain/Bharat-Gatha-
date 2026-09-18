import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
  isSoundMuted: boolean;
  isMusicMuted: boolean;
  isTimerVisible: boolean;
}

const initialState: SettingsState = {
  isSoundMuted: false,
  isMusicMuted: false,
  isTimerVisible: false,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setIsSoundMuted: (state, action: PayloadAction<boolean>) => {
      state.isSoundMuted = action.payload;
    },
    setIsMusicMuted: (state, action: PayloadAction<boolean>) => {
      state.isMusicMuted = action.payload;
    },
    setIsTimerVisible: (state, action: PayloadAction<boolean>) => {
      state.isTimerVisible = action.payload;
    },
  },
});

export const {
  setIsSoundMuted,
  setIsMusicMuted,
  setIsTimerVisible
} = settingsSlice.actions;

export default settingsSlice.reducer;
