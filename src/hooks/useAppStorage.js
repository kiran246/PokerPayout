import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setPlayers } from '../store/playerSlice';
import { setHistory } from '../store/settlementSlice';

/**
 * Custom hook for handling application storage operations
 * 
 * This hook provides a convenient interface for loading, saving, and
 * managing data persistence in the Poker Settlement app.
 */
const useAppStorage = () => {
  const dispatch = useDispatch();
  const { players } = useSelector(state => state.players);
  const { history } = useSelector(state => state.settlements);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Keys for AsyncStorage
  const STORAGE_KEYS = {
    PLAYERS: 'poker_settlement_players',
    HISTORY: 'poker_settlement_history',
    LAST_SYNC: 'poker_settlement_last_sync',
    APP_SETTINGS: 'poker_settlement_settings',
  };

  /**
   * Load all app data from storage
   */
  const loadAppData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load players data
      const playersJson = await AsyncStorage.getItem(STORAGE_KEYS.PLAYERS);
      const storedPlayers = playersJson ? JSON.parse(playersJson) : [];
      
      if (storedPlayers.length > 0) {
        dispatch(setPlayers(storedPlayers));
      }

      // Load history data
      const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      const storedHistory = historyJson ? JSON.parse(historyJson) : [];
      
      if (storedHistory.length > 0) {
        dispatch(setHistory(storedHistory));
      }

      // Load last sync time
      const lastSyncJson = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (lastSyncJson) {
        setLastSyncTime(new Date(JSON.parse(lastSyncJson)));
      }
      
      return true;
    } catch (e) {
      setError(e.message || 'Failed to load app data');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  /**
   * Save players data to storage
   */
  const savePlayers = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
      updateSyncTime();
      return true;
    } catch (e) {
      setError(e.message || 'Failed to save players');
      return false;
    }
  }, [players]);

  /**
   * Save history data to storage
   */
  const saveHistory = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      updateSyncTime();
      return true;
    } catch (e) {
      setError(e.message || 'Failed to save history');
      return false;
    }
  }, [history]);

  /**
   * Update the last sync timestamp
   */
  const updateSyncTime = useCallback(async () => {
    const now = new Date();
    setLastSyncTime(now);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(now.toISOString()));
    } catch (e) {
      console.error('Failed to update sync time:', e);
    }
  }, []);

  /**
   * Save app settings
   * @param {Object} settings - Settings object to save
   */
  const saveSettings = useCallback(async (settings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
      updateSyncTime();
      return true;
    } catch (e) {
      setError(e.message || 'Failed to save app settings');
      return false;
    }
  }, [updateSyncTime]);

  /**
   * Load app settings
   * @returns {Object} - Loaded settings object
   */
  const loadSettings = useCallback(async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      return settingsJson ? JSON.parse(settingsJson) : {};
    } catch (e) {
      setError(e.message || 'Failed to load app settings');
      return {};
    }
  }, []);

  /**
   * Clear all app data
   */
  const clearAllData = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PLAYERS,
        STORAGE_KEYS.HISTORY,
        STORAGE_KEYS.LAST_SYNC,
        STORAGE_KEYS.APP_SETTINGS
      ]);
      
      // Reset Redux state
      dispatch(setPlayers([]));
      dispatch(setHistory([]));
      setLastSyncTime(null);
      
      return true;
    } catch (e) {
      setError(e.message || 'Failed to clear app data');
      return false;
    }
  }, [dispatch]);

  /**
   * Export app data to JSON
   * @returns {Object} - JSON object with all app data
   */
  const exportData = useCallback(() => {
    try {
      const exportData = {
        players,
        history,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0', // Replace with actual app version
      };
      
      return {
        success: true,
        data: exportData,
      };
    } catch (e) {
      setError(e.message || 'Failed to export data');
      return {
        success: false,
        error: e.message,
      };
    }
  }, [players, history]);

  /**
   * Import app data from JSON
   * @param {Object} data - Data to import
   */
  const importData = useCallback(async (data) => {
    try {
      if (!data || !data.players || !data.history) {
        throw new Error('Invalid import data format');
      }
      
      // Import players
      dispatch(setPlayers(data.players));
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(data.players));
      
      // Import history
      dispatch(setHistory(data.history));
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
      
      updateSyncTime();
      
      return {
        success: true,
        message: 'Data imported successfully',
      };
    } catch (e) {
      setError(e.message || 'Failed to import data');
      return {
        success: false,
        error: e.message,
      };
    }
  }, [dispatch, updateSyncTime]);

  // Load app data when component mounts
  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  // Save players to storage when they change
  useEffect(() => {
    if (players.length > 0 && !isLoading) {
      savePlayers();
    }
  }, [players, savePlayers, isLoading]);

  // Save history to storage when it changes
  useEffect(() => {
    if (history.length > 0 && !isLoading) {
      saveHistory();
    }
  }, [history, saveHistory, isLoading]);

  return {
    // Data access
    players,
    history,
    isLoading,
    error,
    lastSyncTime,
    
    // Storage operations
    loadAppData,
    savePlayers,
    saveHistory,
    saveSettings,
    loadSettings,
    clearAllData,
    
    // Data transfer
    exportData,
    importData,
  };
};

export default useAppStorage;