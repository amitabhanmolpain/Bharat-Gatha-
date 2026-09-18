import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProgressionState {
  // Global completion flags
  isStage1Complete: boolean;
  isStage2Complete: boolean;
  isStage3Complete: boolean;
  isStage4Complete: boolean;
  
  // Specific Vijayanagara flags (to be modularized later if needed)
  hasVidyaranyaBlessing: boolean;
  hasMetVidyaranya: boolean;
  isChowkaBaraComplete: boolean;
  isFestivalSceneRestored: boolean;
  isLedgerAssembled: boolean;
  isCampaignComplete: boolean;
}

const initialState: ProgressionState = {
  isStage1Complete: false,
  isStage2Complete: false,
  isStage3Complete: false,
  isStage4Complete: false,
  
  hasVidyaranyaBlessing: false,
  hasMetVidyaranya: false,
  isChowkaBaraComplete: false,
  isFestivalSceneRestored: false,
  isLedgerAssembled: false,
  isCampaignComplete: false,
};

export const progressionSlice = createSlice({
  name: 'progression',
  initialState,
  reducers: {
    setStage1Complete: (state, action: PayloadAction<boolean>) => {
      state.isStage1Complete = action.payload;
    },
    setStage2Complete: (state, action: PayloadAction<boolean>) => {
      state.isStage2Complete = action.payload;
    },
    setStage3Complete: (state, action: PayloadAction<boolean>) => {
      state.isStage3Complete = action.payload;
    },
    setStage4Complete: (state, action: PayloadAction<boolean>) => {
      state.isStage4Complete = action.payload;
    },
    
    setHasVidyaranyaBlessing: (state, action: PayloadAction<boolean>) => {
      state.hasVidyaranyaBlessing = action.payload;
    },
    setHasMetVidyaranya: (state, action: PayloadAction<boolean>) => {
      state.hasMetVidyaranya = action.payload;
    },
    setIsChowkaBaraComplete: (state, action: PayloadAction<boolean>) => {
      state.isChowkaBaraComplete = action.payload;
    },
    setIsFestivalSceneRestored: (state, action: PayloadAction<boolean>) => {
      state.isFestivalSceneRestored = action.payload;
    },
    setIsLedgerAssembled: (state, action: PayloadAction<boolean>) => {
      state.isLedgerAssembled = action.payload;
    },
    setIsCampaignComplete: (state, action: PayloadAction<boolean>) => {
      state.isCampaignComplete = action.payload;
    },
  },
});

export const {
  setStage1Complete,
  setStage2Complete,
  setStage3Complete,
  setStage4Complete,
  setHasVidyaranyaBlessing,
  setHasMetVidyaranya,
  setIsChowkaBaraComplete,
  setIsFestivalSceneRestored,
  setIsLedgerAssembled,
  setIsCampaignComplete
} = progressionSlice.actions;

export default progressionSlice.reducer;
