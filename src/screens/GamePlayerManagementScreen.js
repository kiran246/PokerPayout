import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addPlayer } from '../store/playerSlice';
import { addPlayerToGame, startNewGame } from '../store/settlementSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const GamePlayerManagementScreen = ({ route, navigation }) => {
  const { gameId, gameName, isNewGame } = route.params;
  const dispatch = useDispatch();
  const { players } = useSelector(state => state.players);
  const { games } = useSelector(state => state.settlements);
  
  // Create a new game if needed
  useEffect(() => {
    if (isNewGame && gameName) {
      dispatch(startNewGame({
        gameName: gameName,
        buyIn: 0
      }));
    }
  }, [isNewGame, gameName, dispatch]);
  
  // Find the current game - if it's a new game, it might not be immediately available
  const currentGame = gameId ? games.find(game => game.id === gameId) : games[games.length - 1];
  
  // Get players already in this game
  const gamePlayers = currentGame?.players || [];
  const gamePlayerIds = gamePlayers.map(p => p.playerId);
  
  // State
  const [selectedPlayers, setSelectedPlayers] = useState(gamePlayerIds);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter players based on search
  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Generate a random color for new player avatars
  const getRandomColor = () => {
    const colors = [
      '#3498DB', // Blue
      '#2ECC71', // Green
      '#E74C3C', // Red
      '#9B59B6', // Purple
      '#F1C40F', // Yellow
      '#1ABC9C', // Turquoise
      '#D35400', // Orange
      '#34495E', // Dark Blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Handle adding a new player
  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Error', 'Please enter a player name');
      return;
    }
    
    // Check if player with this name already exists
    const playerExists = players.some(
      player => player.name.toLowerCase() === newPlayerName.trim().toLowerCase()
    );
    
    if (playerExists) {
      Alert.alert(
        'Duplicate Player',
        'A player with this name already exists. Please select them from the list instead.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Create the new player
    const newPlayer = {
      name: newPlayerName.trim(),
      avatarColor: getRandomColor()
    };
    
    // Add to global players list
    dispatch(addPlayer(newPlayer));
    
    // Reset modal
    setNewPlayerName('');
    setShowAddPlayerModal(false);
    
    // Success message
    Alert.alert('Success', 'Player added successfully!');
  };
  
  // Toggle player selection
  const togglePlayerSelection = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };
  
  // Save selected players to the game
  const savePlayersToGame = () => {
    if (selectedPlayers.length === 0) {
      Alert.alert('Error', 'Please select at least one player for this game');
      return;
    }
    
    // Get the actual currentGame ID
    const actualGameId = currentGame?.id || null;
    
    if (!actualGameId) {
      Alert.alert('Error', 'Game not found. Please try again.');
      return;
    }
    
    // For each selected player, add to game if not already in it
    selectedPlayers.forEach(playerId => {
      if (!gamePlayerIds.includes(playerId)) {
        dispatch(addPlayerToGame({ 
          gameId: actualGameId,
          playerId,
          initialBuyIn: currentGame?.buyIn || 0
        }));
      }
    });
    
    // Navigate to the balance entry screen
    navigation.navigate('PreSettlementScreen', {
      gameId: actualGameId,
      gameName: currentGame.name
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
          <Text style={styles.headerTitle}>
            Players for {gameName || 'Game'}
          </Text>
          <View style={styles.rightPlaceholder} />
        </View>
      </LinearGradient>
      
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={24} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search players..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.actionBar}>
          <Text style={styles.selectionCount}>
            {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddPlayerModal(true)}
          >
            <MaterialIcons name="person-add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add New Player</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={filteredPlayers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.playerItem,
                selectedPlayers.includes(item.id) && styles.selectedPlayerItem
              ]}
              onPress={() => togglePlayerSelection(item.id)}
            >
              <View style={styles.playerInfo}>
                <View 
                  style={[
                    styles.avatar, 
                    { backgroundColor: item.avatarColor || '#3498DB' }
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {item.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.playerName}>{item.name}</Text>
              </View>
              
              <View style={[
                styles.checkbox,
                selectedPlayers.includes(item.id) && styles.checkboxSelected
              ]}>
                {selectedPlayers.includes(item.id) && (
                  <MaterialIcons name="check" size={18} color="white" />
                )}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.playersList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 
                  'No players found matching your search' : 
                  'No players available'}
              </Text>
              <TouchableOpacity
                style={styles.addFirstPlayerButton}
                onPress={() => setShowAddPlayerModal(true)}
              >
                <Text style={styles.addFirstPlayerText}>Add First Player</Text>
              </TouchableOpacity>
            </View>
          }
        />
        
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={savePlayersToGame}
          >
            <Text style={styles.saveButtonText}>Save Players to Game</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Add Player Modal */}
      <Modal
        visible={showAddPlayerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddPlayerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Player</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter player name"
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewPlayerName('');
                  setShowAddPlayerModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.addModalButton,
                  !newPlayerName.trim() && styles.disabledButton
                ]}
                onPress={handleAddPlayer}
                disabled={!newPlayerName.trim()}
              >
                <Text style={styles.addModalButtonText}>Add Player</Text>
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
    textAlign: 'center',
  },
  rightPlaceholder: {
    width: 34, // Same width as backButton for alignment
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
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  selectionCount: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498DB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  playersList: {
    padding: 15,
    paddingTop: 0,
  },
  playerItem: {
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
  selectedPlayerItem: {
    backgroundColor: '#E1F0FF',
    borderWidth: 1,
    borderColor: '#3498DB',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3498DB',
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
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 15,
  },
  addFirstPlayerButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addFirstPlayerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  bottomBar: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  saveButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
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
    fontSize: 20,
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

export default GamePlayerManagementScreen;