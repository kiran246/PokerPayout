// src/api/playerApi.js
import { store } from '../store';
import { 
  addPlayer, 
  updatePlayer, 
  deletePlayer, 
  setPlayers 
} from '../store/playerSlice';
import { savePlayers, loadPlayers } from './storage';

export const PlayerAPI = {
  // Get all players
  getAll: () => {
    return store.getState().players.players;
  },
  
  // Get a player by ID
  getById: (id) => {
    const players = store.getState().players.players;
    return players.find(player => player.id === id);
  },
  
  // Add a new player
  add: (playerData) => {
    store.dispatch(addPlayer(playerData));
    // Persist changes to storage
    const updatedPlayers = store.getState().players.players;
    savePlayers(updatedPlayers);
    return playerData;
  },
  
  // Update a player
  update: (id, playerData) => {
    store.dispatch(updatePlayer({ id, ...playerData }));
    // Persist changes to storage
    const updatedPlayers = store.getState().players.players;
    savePlayers(updatedPlayers);
    return { id, ...playerData };
  },
  
  // Delete a player
  delete: (id) => {
    store.dispatch(deletePlayer(id));
    // Persist changes to storage
    const updatedPlayers = store.getState().players.players;
    savePlayers(updatedPlayers);
    return id;
  },
  
  // Load players from storage
  load: async () => {
    try {
      const storedPlayers = await loadPlayers();
      if (storedPlayers && storedPlayers.length > 0) {
        store.dispatch(setPlayers(storedPlayers));
      }
      return storedPlayers;
    } catch (error) {
      console.error('Error loading players:', error);
      return [];
    }
  }
};


/* Examples:
///import { PlayerAPI } from '../api/playerApi';
const allPlayers = PlayerAPI.getAll();
const player = PlayerAPI.getById('player-123');
const newPlayer = PlayerAPI.add({ name: 'New Player', avatarColor: '#FF0000' });
PlayerAPI.update('player-123', { name: 'Updated Name' });
PlayerAPI.delete('player-123');*/