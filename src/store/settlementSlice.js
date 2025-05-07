import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sessionId: null,
  balances: {},  // { playerId: amount }
  settlements: [], // [{ from: playerId, to: playerId, amount: number }]
  history: [],  // Past sessions with their settlements
  gameLog: [], // New field for transaction log during a game
  games: [], // Individual games within a session
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
      state.gameLog = [];
      state.games = [];
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
          games: [...state.games],
          gameLog: [...state.gameLog]
        });
        state.sessionId = null;
        state.balances = {};
        state.settlements = [];
        state.gameLog = [];
        state.games = [];
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
      state.gameLog = [];
      state.games = [];
    },
    
    // New reducers for game management
    startNewGame: (state, action) => {
      const { gameName, buyIn } = action.payload;
      const gameId = Date.now().toString();
      
      state.games.push({
        id: gameId,
        sessionId: state.sessionId,
        name: gameName || `Game ${state.games.length + 1}`,
        startTime: new Date().toISOString(),
        endTime: null,
        buyIn: buyIn || 0,
        players: [], // Players who joined this specific game
        transactions: [], // In-game transactions
        balances: {}, // New field to store the player balances for this game specifically
      });
    },
    
    endGame: (state, action) => {
      const { gameId } = action.payload;
      const gameIndex = state.games.findIndex(game => game.id === gameId);
      
      if (gameIndex !== -1) {
        state.games[gameIndex].endTime = new Date().toISOString();
      }
    },
    
    addPlayerToGame: (state, action) => {
      const { gameId, playerId, initialBuyIn } = action.payload;
      const gameIndex = state.games.findIndex(game => game.id === gameId);
      
      if (gameIndex !== -1) {
        // Check if player is already in the game
        if (!state.games[gameIndex].players.some(p => p.playerId === playerId)) {
          state.games[gameIndex].players.push({
            playerId,
            joinTime: new Date().toISOString(),
            initialBuyIn: initialBuyIn || state.games[gameIndex].buyIn,
            currentStack: initialBuyIn || state.games[gameIndex].buyIn,
          });
        }
      }
    },

    updateTransactionAmount: (state, action) => {
      const { transactionId, newAmount } = action.payload;
      
      // Find the transaction in the game log
      const transactionIndex = state.gameLog.findIndex(t => t.id === transactionId);
      
      if (transactionIndex !== -1) {
        const transaction = state.gameLog[transactionIndex];
        const oldAmount = transaction.amount;
        const playerId = transaction.playerId;
        const gameId = transaction.gameId;
        const type = transaction.type;
        
        // Calculate the difference between old and new amounts
        const amountDiff = newAmount - oldAmount;
        
        // Update the amount in gameLog
        state.gameLog[transactionIndex].amount = newAmount;
        
        // Update the transaction in the specific game if applicable
        if (gameId) {
          const gameIndex = state.games.findIndex(game => game.id === gameId);
          if (gameIndex !== -1) {
            const gameTransactionIndex = state.games[gameIndex].transactions.findIndex(t => t.id === transactionId);
            if (gameTransactionIndex !== -1) {
              state.games[gameIndex].transactions[gameTransactionIndex].amount = newAmount;
            }
            
            // Update player's stack in the game
            const playerIndex = state.games[gameIndex].players.findIndex(p => p.playerId === playerId);
            if (playerIndex !== -1 && type === 'buy-in') {
              // For buy-ins, increase the stack by the difference
              state.games[gameIndex].players[playerIndex].currentStack += amountDiff;
            }
          }
        }
        
        // Update the overall session balance
        if (type === 'buy-in') {
          // For buy-ins, updating amount means more/less was taken from player
          state.balances[playerId] = (state.balances[playerId] || 0) - amountDiff;
        } else if (type === 'cash-out') {
          // For cash-outs, updating amount means more/less was given to player
          state.balances[playerId] = (state.balances[playerId] || 0) + amountDiff;
        }
      }
    },
    
    recordTransaction: (state, action) => {
      const { type, playerId, amount, gameId, description } = action.payload;
      const transactionId = Date.now().toString();
      
      // Add to general game log
      state.gameLog.push({
        id: transactionId,
        type, // 'buy-in', 'cash-out', 'loan', etc.
        playerId,
        amount,
        timestamp: new Date().toISOString(),
        gameId,
        description,
      });
      
      // Update game-specific transactions if gameId is provided
      if (gameId) {
        const gameIndex = state.games.findIndex(game => game.id === gameId);
        if (gameIndex !== -1) {
          state.games[gameIndex].transactions.push({
            id: transactionId,
            type,
            playerId,
            amount,
            timestamp: new Date().toISOString(),
            description,
          });
          
          // Update player's stack in the game
          const playerIndex = state.games[gameIndex].players.findIndex(p => p.playerId === playerId);
          if (playerIndex !== -1) {
            if (type === 'buy-in') {
              state.games[gameIndex].players[playerIndex].currentStack += amount;
            } else if (type === 'cash-out') {
              state.games[gameIndex].players[playerIndex].currentStack -= amount;
            }
          }
        }
      }
      
      // Update the overall session balance
      if (type === 'buy-in') {
        state.balances[playerId] = (state.balances[playerId] || 0) - amount;
      } else if (type === 'cash-out') {
        state.balances[playerId] = (state.balances[playerId] || 0) + amount;
      }
    },
    
    deleteTransaction: (state, action) => {
      const { transactionId } = action.payload;
      
      // Find the transaction in the game log
      const transactionIndex = state.gameLog.findIndex(t => t.id === transactionId);
      
      if (transactionIndex !== -1) {
        const transaction = state.gameLog[transactionIndex];
        const { gameId, playerId, type, amount } = transaction;
        
        // Remove from general game log
        state.gameLog.splice(transactionIndex, 1);
        
        // Remove from game-specific transactions if gameId is provided
        if (gameId) {
          const gameIndex = state.games.findIndex(game => game.id === gameId);
          if (gameIndex !== -1) {
            // Find and remove the transaction from game transactions
            const gameTransactionIndex = state.games[gameIndex].transactions.findIndex(t => t.id === transactionId);
            if (gameTransactionIndex !== -1) {
              state.games[gameIndex].transactions.splice(gameTransactionIndex, 1);
            }
            
            // Update player's stack in the game
            const playerIndex = state.games[gameIndex].players.findIndex(p => p.playerId === playerId);
            if (playerIndex !== -1) {
              if (type === 'buy-in') {
                // If deleting a buy-in, reduce the current stack
                state.games[gameIndex].players[playerIndex].currentStack -= amount;
              } else if (type === 'cash-out') {
                // If deleting a cash-out, increase the current stack
                state.games[gameIndex].players[playerIndex].currentStack += amount;
              }
            }
          }
        }
        
        // Update the overall session balance
        if (type === 'buy-in') {
          // If deleting a buy-in, add the amount back to the balance
          state.balances[playerId] = (state.balances[playerId] || 0) + amount;
        } else if (type === 'cash-out') {
          // If deleting a cash-out, subtract the amount from the balance
          state.balances[playerId] = (state.balances[playerId] || 0) - amount;
        }
      }
    },
    
    updateGameDetails: (state, action) => {
      const { gameId, name, buyIn } = action.payload;
      const gameIndex = state.games.findIndex(game => game.id === gameId);
      
      if (gameIndex !== -1) {
        if (name) state.games[gameIndex].name = name;
        if (buyIn !== undefined) state.games[gameIndex].buyIn = buyIn;
      }
    },
    
    updatePlayerStack: (state, action) => {
      const { gameId, playerId, stack } = action.payload;
      const gameIndex = state.games.findIndex(game => game.id === gameId);
      
      if (gameIndex !== -1) {
        const playerIndex = state.games[gameIndex].players.findIndex(p => p.playerId === playerId);
        if (playerIndex !== -1) {
          state.games[gameIndex].players[playerIndex].currentStack = stack;
        }
      }
    },

    // New reducer to update game balances
    updateGameBalances: (state, action) => {
      const { gameId, balances } = action.payload;
      const gameIndex = state.games.findIndex(game => game.id === gameId);
      
      if (gameIndex !== -1) {
        // Initialize balances object if it doesn't exist
        if (!state.games[gameIndex].balances) {
          state.games[gameIndex].balances = {};
        }
        
        // Store the balances
        Object.entries(balances).forEach(([playerId, balance]) => {
          const numBalance = balance === '' || balance === '-' ? 0 : parseFloat(balance) || 0;
          state.games[gameIndex].balances[playerId] = numBalance;
        });
      }
    },

    // New reducer to save settlements for a specific game
    saveGameSettlements: (state, action) => {
      const { gameId, settlements } = action.payload;
      const gameIndex = state.games.findIndex(game => game.id === gameId);
      
      if (gameIndex !== -1) {
        state.games[gameIndex].settlements = settlements;
      }
    }
  }
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
  resetSession,
  // Game management actions
  startNewGame,
  endGame,
  addPlayerToGame,
  recordTransaction,
  deleteTransaction,
  updateGameDetails,
  updatePlayerStack,
  updateTransactionAmount,
  // New actions
  updateGameBalances,
  saveGameSettlements
} = settlementSlice.actions;

export default settlementSlice.reducer;