// src/utils/backupUtils.js
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { store } from '../store';
import { setPlayers } from '../store/playerSlice';
import { setHistory } from '../store/settlementSlice';
import { savePlayers, saveHistory } from '../api/storage';

export const BackupUtils = {
  // Create a backup of all app data
  createBackup: async () => {
    try {
      const { players } = store.getState().players;
      const { history } = store.getState().settlements;
      
      const backupData = {
        appVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        data: {
          players,
          history
        }
      };
      
      const backupString = JSON.stringify(backupData, null, 2);
      const fileUri = `${FileSystem.documentDirectory}poker_settlement_backup_${Date.now()}.json`;
      
      await FileSystem.writeAsStringAsync(fileUri, backupString);
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Poker Settlement Data'
        });
        return { success: true, fileUri };
      } else {
        return { success: false, error: 'Sharing not available on this device' };
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Restore from a backup file
  restoreFromBackup: async () => {
    try {
      // Pick a document
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        return { success: false, error: 'Document picking was canceled' };
      }
      
      // Read the file content
      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const backupData = JSON.parse(fileContent);
      
      // Validate backup format
      if (!backupData.data || !backupData.data.players || !backupData.data.history) {
        return { success: false, error: 'Invalid backup file format' };
      }
      
      // Restore the data
      store.dispatch(setPlayers(backupData.data.players));
      store.dispatch(setHistory(backupData.data.history));
      
      // Persist the restored data
      await savePlayers(backupData.data.players);
      await saveHistory(backupData.data.history);
      
      return { 
        success: true, 
        message: 'Data restored successfully',
        playersCount: backupData.data.players.length,
        historyCount: backupData.data.history.length
      };
    } catch (error) {
      console.error('Error restoring backup:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Clear all app data
  clearAllData: async () => {
    try {
      store.dispatch(setPlayers([]));
      store.dispatch(setHistory([]));
      
      await savePlayers([]);
      await saveHistory([]);
      
      return { success: true, message: 'All data cleared successfully' };
    } catch (error) {
      console.error('Error clearing data:', error);
      return { success: false, error: error.message };
    }
  }
};