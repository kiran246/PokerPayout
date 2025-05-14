import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Share,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { startNewSession, deleteGame, setHistory } from '../store/settlementSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as MailComposer from 'expo-mail-composer';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const GameSessionsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { history, games } = useSelector(state => state.settlements);
  const { players } = useSelector(state => state.players);
  
  // State
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGames, setSelectedGames] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  
  // Combine past games from history and current games
  const allGames = [
    // Games from history sessions
    ...history.flatMap(session => 
      (session.games || []).map(game => ({
        ...game,
        isHistorical: true,
        sessionDate: session.date,
        status: 'COMPLETED'
      }))
    ),
    // Current games that aren't in a completed session
    ...games.map(game => ({
      ...game,
      isHistorical: false,
      status: game.endTime ? 'COMPLETED' : 'PENDING'
    }))
  ];
  
  // Filter games based on search
  const filteredGames = allGames.filter(game => 
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort by most recent first, then pending before completed
  const sortedGames = [...filteredGames].sort((a, b) => {
    // Status first (PENDING before COMPLETED)
    if (a.status !== b.status) {
      return a.status === 'PENDING' ? -1 : 1;
    }
    // Then by date (newest first)
    const dateA = a.startTime || a.sessionDate || '';
    const dateB = b.startTime || b.sessionDate || '';
    return new Date(dateB) - new Date(dateA);
  });
  
  // Handle adding a new game
  const handleAddGame = () => {
    if (!newGameName.trim()) {
      Alert.alert('Error', 'Please enter a game name');
      return;
    }
    
    // Check if a game with this name already exists
    const gameExists = allGames.some(
      game => game.name.toLowerCase() === newGameName.trim().toLowerCase()
    );
    
    if (gameExists) {
      Alert.alert(
        'Duplicate Game',
        'A game with this name already exists. Please use a different name.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Start a new session if none exists
    dispatch(startNewSession());
    
    // Navigate to player selection for the new game
    navigation.navigate('GamePlayerManagementScreen', {
      gameId: null, // Will be created in the player management screen
      gameName: newGameName.trim(),
      isNewGame: true
    });
    
    // Reset modal
    setNewGameName('');
    setShowAddGameModal(false);
  };
  
  // Handle game selection
  const handleGameSelect = (game) => {
    if (selectionMode) {
      // Toggle selection
      if (selectedGames.some(g => g.id === game.id)) {
        setSelectedGames(selectedGames.filter(g => g.id !== game.id));
      } else {
        setSelectedGames([...selectedGames, game]);
      }
    } else {
      if (game.status === 'COMPLETED') {
        // View completed game details
        navigation.navigate('GameLedgerScreen', { 
          gameId: game.id,
          isHistorical: game.isHistorical
        });
      } else {
        // Continue with pending game - go to player management first
        navigation.navigate('GamePlayerManagementScreen', { 
          gameId: game.id,
          gameName: game.name
        });
      }
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle game deletion
  const handleDeleteGame = (game) => {
    Alert.alert(
      'Delete Game',
      `Are you sure you want to delete "${game.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (game.isHistorical) {
              // Delete from history
              const updatedHistory = history.map(session => {
                if (session.games) {
                  return {
                    ...session,
                    games: session.games.filter(g => g.id !== game.id)
                  };
                }
                return session;
              });
              dispatch(setHistory(updatedHistory));
            } else {
              // Delete from current games
              dispatch(deleteGame({ gameId: game.id }));
            }
            
            // If in selection mode, remove from selected games
            if (selectionMode) {
              setSelectedGames(selectedGames.filter(g => g.id !== game.id));
            }
          }
        }
      ]
    );
  };

  // Generate backup for email
  const generateBackup = async () => {
    try {
      setIsGeneratingBackup(true);
      
      // Determine which games to back up
      const gamesToBackup = selectionMode && selectedGames.length > 0 
        ? selectedGames 
        : allGames;
      
      // Find players in the selected games
      const playerIds = new Set();
      gamesToBackup.forEach(game => {
        // Add players from game.players
        if (game.players) {
          game.players.forEach(player => playerIds.add(player.playerId));
        }
        
        // Add players from game.balances
        if (game.balances) {
          Object.keys(game.balances).forEach(id => playerIds.add(id));
        }
      });
      
      // Get full player data for the involved players
      const involvedPlayers = players.filter(player => playerIds.has(player.id));
      
      // Create backup data object
      const backupData = {
        appVersion: '1.0.0',
        exportDate: new Date().toISOString(),
        games: gamesToBackup,
        players: involvedPlayers
      };
      
      // Convert to JSON string
      const backupJson = JSON.stringify(backupData, null, 2);
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `poker_payout_backup_${timestamp}.json`;
      
      // Save to temporary file
      const filePath = `${FileSystem.cacheDirectory}${backupFileName}`;
      await FileSystem.writeAsStringAsync(filePath, backupJson);
      
      return filePath;
    } catch (error) {
      console.error('Error generating backup:', error);
      Alert.alert('Error', 'Failed to generate backup');
      return null;
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  // Email backup
  const emailBackup = async () => {
    if (!emailAddress.trim()) {
      Alert.alert('Email Required', 'Please enter an email address');
      return;
    }
    
    try {
      // Check if email is available
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Email Not Available', 
          'Email functionality is not available on this device. Try using the "Share" option instead.'
        );
        return;
      }
      
      // Generate backup file
      const backupFile = await generateBackup();
      if (!backupFile) return;
      
      // Get game names for email subject
      const gameNames = selectionMode && selectedGames.length > 0
        ? selectedGames.map(g => g.name).join(', ')
        : 'All Games';
      
      // Send email
      const result = await MailComposer.composeAsync({
        subject: `Poker Payout Backup - ${gameNames}`,
        body: `Attached is your Poker Payout backup for the following games: ${gameNames}.\n\nThis file can be imported back into the app if needed.`,
        recipients: [emailAddress],
        attachments: [backupFile]
      });
      
      if (result.status === 'sent') {
        Alert.alert('Success', 'Backup has been emailed successfully');
        setShowEmailModal(false);
        setEmailAddress('');
        
        // Exit selection mode if active
        if (selectionMode) {
          setSelectionMode(false);
          setSelectedGames([]);
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send backup via email');
    }
  };

  // Share backup file
  const shareBackup = async () => {
    try {
      // Generate backup file
      const backupFile = await generateBackup();
      if (!backupFile) return;
      
      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupFile, {
          mimeType: 'application/json',
          dialogTitle: 'Share Poker Payout Backup'
        });
        
        // Exit selection mode if active
        if (selectionMode) {
          setSelectionMode(false);
          setSelectedGames([]);
        }
      } else {
        Alert.alert('Sharing Not Available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing backup:', error);
      Alert.alert('Error', 'Failed to share backup file');
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedGames([]);
    } else {
      setSelectionMode(true);
    }
  };

  // Select all games
  const selectAllGames = () => {
    if (selectedGames.length === filteredGames.length) {
      // Deselect all
      setSelectedGames([]);
    } else {
      // Select all
      setSelectedGames([...filteredGames]);
    }
  };

  // Render game item
  const renderGameItem = ({ item }) => {
    const isSelected = selectedGames.some(game => game.id === item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.gameItem,
          isSelected && styles.selectedGameItem
        ]}
        onPress={() => handleGameSelect(item)}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            setSelectedGames([item]);
          }
        }}
      >
        <View style={styles.gameInfo}>
          {selectionMode && (
            <View style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected
            ]}>
              {isSelected && (
                <MaterialIcons name="check" size={16} color="white" />
              )}
            </View>
          )}
          
          <View style={styles.gameDetails}>
            <Text style={styles.gameName}>{item.name}</Text>
            <Text style={styles.gameDate}>
              {formatDate(item.startTime || item.sessionDate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.gameActions}>
          <View style={styles.gameStatusContainer}>
            <Text style={[
              styles.gameStatus,
              item.status === 'PENDING' ? styles.pendingStatus : styles.completedStatus
            ]}>
              {item.status}
            </Text>
          </View>
          
          {!selectionMode && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteGame(item)}
            >
              <MaterialIcons name="delete" size={20} color="#E74C3C" />
            </TouchableOpacity>
          )}
          
          <MaterialIcons name="chevron-right" size={24} color="#BDC3C7" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2C3E50', '#4CA1AF']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (selectionMode) {
                setSelectionMode(false);
                setSelectedGames([]);
              } else {
                navigation.goBack();
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {selectionMode 
              ? `${selectedGames.length} Selected` 
              : 'Game Sessions'}
          </Text>
          
          {selectionMode ? (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={selectAllGames}
              >
                <MaterialIcons name="select-all" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowEmailModal(true)}
                disabled={selectedGames.length === 0}
              >
                <MaterialIcons 
                  name="email" 
                  size={24} 
                  color={selectedGames.length === 0 ? "rgba(255,255,255,0.5)" : "white"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={shareBackup}
                disabled={selectedGames.length === 0}
              >
                <MaterialIcons 
                  name="share" 
                  size={24} 
                  color={selectedGames.length === 0 ? "rgba(255,255,255,0.5)" : "white"} 
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={toggleSelectionMode}
              >
                <MaterialIcons name="checklist" size={24} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowAddGameModal(true)}
              >
                <MaterialIcons name="add" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
      
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search games..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={24} color="#7F8C8D" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <FlatList
          data={sortedGames}
          keyExtractor={(item, index) => item.id || `game-${index}`}
          renderItem={renderGameItem}
          contentContainerStyle={styles.gamesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="casino" size={50} color="#BDC3C7" />
              <Text style={styles.emptyText}>
                {searchQuery ? 
                  'No games found matching your search' : 
                  'No games available'}
              </Text>
              <TouchableOpacity
                style={styles.addFirstGameButton}
                onPress={() => setShowAddGameModal(true)}
              >
                <Text style={styles.addFirstGameText}>Create First Game</Text>
              </TouchableOpacity>
            </View>
          }
        />
        
        {/* Floating action buttons */}
        {!selectionMode && (
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setShowAddGameModal(true)}
            >
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Add Game Modal */}
      <Modal
        visible={showAddGameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddGameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Game Session</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter game name"
              value={newGameName}
              onChangeText={setNewGameName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewGameName('');
                  setShowAddGameModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.addModalButton,
                  !newGameName.trim() && styles.disabledButton
                ]}
                onPress={handleAddGame}
                disabled={!newGameName.trim()}
              >
                <Text style={styles.addModalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Email Modal */}
      <Modal
        visible={showEmailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Email Backup</Text>
            
            <Text style={styles.modalSubtitle}>
              {selectedGames.length === 1 
                ? `Send backup of "${selectedGames[0].name}"` 
                : `Send backup of ${selectedGames.length} games`}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Email address"
              value={emailAddress}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEmailAddress('');
                  setShowEmailModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.addModalButton,
                  (!emailAddress.trim() || isGeneratingBackup) && styles.disabledButton
                ]}
                onPress={emailBackup}
                disabled={!emailAddress.trim() || isGeneratingBackup}
              >
                {isGeneratingBackup ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.addModalButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2C3E50',
  },
  headerGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 5,
    marginLeft: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  gamesList: {
    padding: 15,
    paddingTop: 0,
    paddingBottom: 80, // Space for FAB
  },
  gameItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedGameItem: {
    backgroundColor: '#E1F0FF',
    borderWidth: 1,
    borderColor: '#3498DB',
  },
  gameInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#3498DB',
  },
  gameDetails: {
    flex: 1,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 5,
  },
  gameDate: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  gameActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameStatusContainer: {
    marginRight: 10,
  },
  gameStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pendingStatus: {
    backgroundColor: '#FFF3CD',
    color: '#D68910',
  },
  completedStatus: {
    backgroundColor: '#D5F5E3',
    color: '#2ECC71',
  },
  deleteButton: {
    padding: 5,
    marginRight: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  addFirstGameButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addFirstGameText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F4F8',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: 'bold',
  },
  addModalButton: {
    backgroundColor: '#3498DB',
    marginLeft: 10,
  },
  addModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // FAB styles
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default GameSessionsScreen;