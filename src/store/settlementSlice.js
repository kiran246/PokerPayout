import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sessionId: null,
  balances: {},  // { playerId: amount }
  settlements: [], // [{ from: playerId, to: playerId, amount: number }]
  history: [],  // Past sessions with their settlements
  loading: false,
  error: null,
};

export const settlementSlice = createSlice({
  name: 'settlements',
  initialState,
  reducers: {
    startNewSession: (state) => {
      state.sessionId = Date.now().toString();
      state.balances = {};
      state.settlements = [];
    },
    updatePlayerBalance: (state, action) => {
      const { playerId, amount } = action.payload;
      state.balances[playerId] = (state.balances[playerId] || 0) + amount;
    },
    setPlayerBalance: (state, action) => {
      const { playerId, amount } = action.payload;
      state.balances[playerId] = amount;
    },
    calculateSettlements: (state) => {
      // This will be calculated based on minimizing the number of transactions
      // Logic in settlement calculator utility function
    },
    saveSettlements: (state, action) => {
      state.settlements = action.payload;
    },
    completeSession: (state) => {
      if (state.sessionId) {
        state.history.push({
          id: state.sessionId,
          date: new Date().toISOString(),
          balances: { ...state.balances },
          settlements: [...state.settlements],
        });
        state.sessionId = null;
        state.balances = {};
        state.settlements = [];
      }
    },
    setHistory: (state, action) => {
      state.history = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    resetSession: (state) => {
      state.balances = {};
      state.settlements = [];
      state.sessionId = null;
    },
  },
});

export const {
  startNewSession,
  updatePlayerBalance,
  setPlayerBalance,
  calculateSettlements,
  saveSettlements,
  completeSession,
  setHistory,
  setLoading,
  setError,
  resetSession

} = settlementSlice.actions;

export default settlementSlice.reducer;