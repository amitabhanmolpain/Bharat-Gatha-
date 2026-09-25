import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './slices/inventorySlice';
import progressionReducer from './slices/progressionSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    progression: progressionReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
