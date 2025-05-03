import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  players: [],
  loading: false,
  error: null,
};

export const playerSlice = createSlice({
  name: 'players',
  initialState,
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
  setError 
} = playerSlice.actions;

export default playerSlice.reducer;