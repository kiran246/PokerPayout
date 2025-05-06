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
  StatusBar
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { startNewSession } from '../store/settlementSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const GameSessionsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { history, games } = useSelector(state => state.settlements);
  
  // State
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
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
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Game Sessions</Text>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddGameModal(true)}
          >
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
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
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gameItem}
              onPress={() => handleGameSelect(item)}
            >
              <View style={styles.gameInfo}>
                <Text style={styles.gameName}>{item.name}</Text>
                <Text style={styles.gameDate}>
                  {formatDate(item.startTime || item.sessionDate)}
                </Text>
              </View>
              
              <View style={styles.gameStatusContainer}>
                <Text style={[
                  styles.gameStatus,
                  item.status === 'PENDING' ? styles.pendingStatus : styles.completedStatus
                ]}>
                  {item.status}
                </Text>
                <MaterialIcons name="chevron-right" size={24} color="#BDC3C7" />
              </View>
            </TouchableOpacity>
          )}
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
  addButton: {
    padding: 5,
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
  gameInfo: {
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
  gameStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 5,
  },
  pendingStatus: {
    backgroundColor: '#FFF3CD',
    color: '#D68910',
  },
  completedStatus: {
    backgroundColor: '#D5F5E3',
    color: '#2ECC71',
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
});

export default GameSessionsScreen;