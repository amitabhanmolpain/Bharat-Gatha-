import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface InventoryState {
  unlockedJournalEntries: string[];
  collectedFragments: string[];
  
  // Specific item flags
  hasJournalToy: boolean;
  hasFinalKeepsake: boolean;
  
  // Fragment booleans for quick access
  hasFirstLedgerFragment: boolean;
  hasSecondLedgerFragment: boolean;
  hasFinalLedgerFragment: boolean;
}

const initialState: InventoryState = {
  unlockedJournalEntries: [],
  collectedFragments: [],
  
  hasJournalToy: false,
  hasFinalKeepsake: false,
  
  hasFirstLedgerFragment: false,
  hasSecondLedgerFragment: false,
  hasFinalLedgerFragment: false,
};

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addJournalEntry: (state, action: PayloadAction<string>) => {
      if (!state.unlockedJournalEntries.includes(action.payload)) {
        state.unlockedJournalEntries.push(action.payload);
      }
    },
    setJournalEntries: (state, action: PayloadAction<string[]>) => {
      state.unlockedJournalEntries = action.payload;
    },
    addCollectedFragment: (state, action: PayloadAction<string>) => {
      if (!state.collectedFragments.includes(action.payload)) {
        state.collectedFragments.push(action.payload);
      }
    },
    
    setHasJournalToy: (state, action: PayloadAction<boolean>) => {
      state.hasJournalToy = action.payload;
    },
    setHasFinalKeepsake: (state, action: PayloadAction<boolean>) => {
      state.hasFinalKeepsake = action.payload;
    },
    
    setHasFirstLedgerFragment: (state, action: PayloadAction<boolean>) => {
      state.hasFirstLedgerFragment = action.payload;
    },
    setHasSecondLedgerFragment: (state, action: PayloadAction<boolean>) => {
      state.hasSecondLedgerFragment = action.payload;
    },
    setHasFinalLedgerFragment: (state, action: PayloadAction<boolean>) => {
      state.hasFinalLedgerFragment = action.payload;
    },
  },
});

export const {
  addJournalEntry,
  setJournalEntries,
  addCollectedFragment,
  setHasJournalToy,
  setHasFinalKeepsake,
  setHasFirstLedgerFragment,
  setHasSecondLedgerFragment,
  setHasFinalLedgerFragment
} = inventorySlice.actions;

export default inventorySlice.reducer;
