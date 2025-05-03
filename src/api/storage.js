import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage API for Poker Settlement App
 * 
 * This module provides functions for persisting and retrieving app data
 * using AsyncStorage. It handles serialization, error handling, and
 * version management for all app data.
 */

// Storage keys
export const STORAGE_KEYS = {
  PLAYERS: 'poker_settlement_players',
  SETTLEMENTS: 'poker_settlement_settlements',
  HISTORY: 'poker_settlement_history',
  SETTINGS: 'poker_settlement_settings',
  APP_VERSION: 'poker_settlement_version',
  LAST_SYNC: 'poker_settlement_last_sync',
};

// Current app version for data migration
const CURRENT_APP_VERSION = '1.0.0';

/**
 * Initialize storage with default values if needed
 * @returns {Promise<boolean>} Success status
 */
export const initializeStorage = async () => {
  try {
    // Check if app version exists
    const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
    
    if (!storedVersion) {
      // First run, set default values
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.PLAYERS, JSON.stringify([])],
        [STORAGE_KEYS.SETTLEMENTS, JSON.stringify([])],
        [STORAGE_KEYS.HISTORY, JSON.stringify([])],
        [STORAGE_KEYS.SETTINGS, JSON.stringify(getDefaultSettings())],
        [STORAGE_KEYS.APP_VERSION, CURRENT_APP_VERSION],
        [STORAGE_KEYS.LAST_SYNC, JSON.stringify(new Date().toISOString())],
      ]);
      return true;
    } else if (storedVersion !== CURRENT_APP_VERSION) {
      // Version changed, run migrations if needed
      await migrateData(storedVersion, CURRENT_APP_VERSION);
      await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, CURRENT_APP_VERSION);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};

/**
 * Get default settings for the app
 * @returns {Object} Default settings object
 */
const getDefaultSettings = () => {
  return {
    theme: 'light',
    currency: 'USD',
    showTutorial: true,
    notificationsEnabled: true,
    autoBackupEnabled: false,
    soundsEnabled: true,
  };
};

/**
 * Run data migrations between app versions
 * @param {string} fromVersion - Old version
 * @param {string} toVersion - New version
 * @returns {Promise<void>}
 */
const migrateData = async (fromVersion, toVersion) => {
  // Handle migrations between specific versions here
  console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
  
  // Example migration:
  // if (fromVersion === '0.9.0' && toVersion === '1.0.0') {
  //   // Migrate data from 0.9.0 to 1.0.0
  // }
  
  // For now, no migrations are needed
};

/**
 * Save players data to storage
 * @param {Array} players - Array of player objects
 * @returns {Promise<boolean>} Success status
 */
export const savePlayers = async (players) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    await updateLastSync();
    return true;
  } catch (error) {
    console.error('Error saving players:', error);
    return false;
  }
};

/**
 * Load players data from storage
 * @returns {Promise<Array>} Array of player objects
 */
export const loadPlayers = async () => {
  try {
    const playersData = await AsyncStorage.getItem(STORAGE_KEYS.PLAYERS);
    return playersData ? JSON.parse(playersData) : [];
  } catch (error) {
    console.error('Error loading players:', error);
    return [];
  }
};

/**
 * Save settlements data to storage
 * @param {Array} settlements - Array of settlement objects
 * @returns {Promise<boolean>} Success status
 */
export const saveSettlements = async (settlements) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
    await updateLastSync();
    return true;
  } catch (error) {
    console.error('Error saving settlements:', error);
    return false;
  }
};

/**
 * Load settlements data from storage
 * @returns {Promise<Array>} Array of settlement objects
 */
export const loadSettlements = async () => {
  try {
    const settlementsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
    return settlementsData ? JSON.parse(settlementsData) : [];
  } catch (error) {
    console.error('Error loading settlements:', error);
    return [];
  }
};

/**
 * Save history data to storage
 * @param {Array} history - Array of history session objects
 * @returns {Promise<boolean>} Success status
 */
export const saveHistory = async (history) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    await updateLastSync();
    return true;
  } catch (error) {
    console.error('Error saving history:', error);
    return false;
  }
};

/**
 * Load history data from storage
 * @returns {Promise<Array>} Array of history session objects
 */
export const loadHistory = async () => {
  try {
    const historyData = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    return historyData ? JSON.parse(historyData) : [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
};

/**
 * Save app settings to storage
 * @param {Object} settings - Settings object
 * @returns {Promise<boolean>} Success status
 */
export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

/**
 * Load app settings from storage
 * @returns {Promise<Object>} Settings object
 */
export const loadSettings = async () => {
  try {
    const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settingsData ? JSON.parse(settingsData) : getDefaultSettings();
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
};

/**
 * Update last sync timestamp
 * @returns {Promise<void>}
 */
export const updateLastSync = async () => {
  try {
    const timestamp = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, JSON.stringify(timestamp));
  } catch (error) {
    console.error('Error updating last sync timestamp:', error);
  }
};

/**
 * Get last sync timestamp
 * @returns {Promise<string|null>} ISO timestamp or null
 */
export const getLastSync = async () => {
  try {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? JSON.parse(timestamp) : null;
  } catch (error) {
    console.error('Error getting last sync timestamp:', error);
    return null;
  }
};

/**
 * Export all app data to a single JSON object
 * @returns {Promise<Object>} Exported data object
 */
export const exportAllData = async () => {
  try {
    const [players, settlements, history, settings] = await Promise.all([
      loadPlayers(),
      loadSettlements(),
      loadHistory(),
      loadSettings(),
    ]);
    
    return {
      appVersion: CURRENT_APP_VERSION,
      exportDate: new Date().toISOString(),
      data: {
        players,
        settlements,
        history,
        settings,
      },
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
};

/**
 * Import data from exported JSON object
 * @param {Object} importData - Data object to import
 * @returns {Promise<Object>} Result with success status and message
 */
export const importAllData = async (importData) => {
  try {
    // Validate import data
    if (!importData || !importData.data) {
      return {
        success: false,
        message: 'Invalid import data format',
      };
    }
    
    const { data } = importData;
    
    // Import each data type if present
    if (data.players) {
      await savePlayers(data.players);
    }
    
    if (data.settlements) {
      await saveSettlements(data.settlements);
    }
    
    if (data.history) {
      await saveHistory(data.history);
    }
    
    if (data.settings) {
      await saveSettings(data.settings);
    }
    
    await updateLastSync();
    
    return {
      success: true,
      message: 'Data imported successfully',
    };
  } catch (error) {
    console.error('Error importing data:', error);
    return {
      success: false,
      message: `Import failed: ${error.message}`,
    };
  }
};

/**
 * Clear all app data
 * @returns {Promise<boolean>} Success status
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PLAYERS,
      STORAGE_KEYS.SETTLEMENTS,
      STORAGE_KEYS.HISTORY,
    ]);
    
    // Re-initialize with defaults
    await initializeStorage();
    
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
};

/**
 * Get storage usage statistics
 * @returns {Promise<Object>} Storage stats object
 */
export const getStorageStats = async () => {
  try {
    const [players, settlements, history] = await Promise.all([
      loadPlayers(),
      loadSettlements(),
      loadHistory(),
    ]);
    
    return {
      players: {
        count: players.length,
        size: JSON.stringify(players).length,
      },
      settlements: {
        count: settlements.length,
        size: JSON.stringify(settlements).length,
      },
      history: {
        count: history.length,
        size: JSON.stringify(history).length,
      },
      totalSize: JSON.stringify({players, settlements, history}).length,
      lastSync: await getLastSync(),
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return null;
  }
};

export default {
  initializeStorage,
  savePlayers,
  loadPlayers,
  saveSettlements,
  loadSettlements,
  saveHistory,
  loadHistory,
  saveSettings,
  loadSettings,
  updateLastSync,
  getLastSync,
  exportAllData,
  importAllData,
  clearAllData,
  getStorageStats,
  STORAGE_KEYS,
};