import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  players: [],
  loading: false,
  error: null,
};

export const playerSlice = createSlice({
  name: 'players',
  initialState: {
    players: [],
    loading: false,
    error: null,
  },
  reducers: {
    addPlayer: (state, action) => {
      state.players.push({
        id: Date.now().toString(),
        name: action.payload.name,
        createdAt: new Date().toISOString(),
      });
    },
    updatePlayer: (state, action) => {
      const { id, name } = action.payload;
      const playerIndex = state.players.findIndex(player => player.id === id);
      if (playerIndex !== -1) {
        state.players[playerIndex].name = name;
      }
    },
    // Add new reducers for buy-in tracking
    recordBuyIn: (state, action) => {
      const { playerId, amount, timestamp, sessionId } = action.payload;
      const playerIndex = state.players.findIndex(player => player.id === playerId);
      
      if (playerIndex !== -1) {
        // Initialize buyIns array if it doesn't exist
        if (!state.players[playerIndex].buyIns) {
          state.players[playerIndex].buyIns = [];
        }
        
        // Add the buy-in record
        state.players[playerIndex].buyIns.push({
          id: Date.now().toString(),
          amount,
          timestamp: timestamp || new Date().toISOString(),
          sessionId
        });
      }
    },
    deleteBuyIn: (state, action) => {
      const { playerId, buyInId } = action.payload;
      const playerIndex = state.players.findIndex(player => player.id === playerId);
      
      if (playerIndex !== -1 && state.players[playerIndex].buyIns) {
        state.players[playerIndex].buyIns = state.players[playerIndex].buyIns.filter(
          buyIn => buyIn.id !== buyInId
        );
      }
    },
    deletePlayer: (state, action) => {
      state.players = state.players.filter(player => player.id !== action.payload);
    },
    setPlayers: (state, action) => {
      state.players = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { 
  addPlayer, 
  updatePlayer, 
  deletePlayer, 
  setPlayers, 
  setLoading,
  recordBuyIn,
  deleteBuyIn, 
  setError 
} = playerSlice.actions;

export default playerSlice.reducer;