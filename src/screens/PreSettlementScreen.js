import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { startNewSession, setPlayerBalance, updateGameBalances } from '../store/settlementSlice';
import { addPlayer, updatePlayer, deletePlayer } from '../store/playerSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const PreSettlementScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { players } = useSelector(state => state.players);
  const { sessionId, balances, games } = useSelector(state => state.settlements);
  
  // State for game setup
  const [step, setStep] = useState(1); // 1: Game Title, 2: Players, 3: Balances
  const [gameTitle, setGameTitle] = useState(route.params?.gameName || '');
  const [gameId, setGameId] = useState(route.params?.gameId || null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerBalances, setPlayerBalances] = useState({});
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingPlayerName, setEditingPlayerName] = useState('');
  const [totalBalance, setTotalBalance] = useState(0);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showPlayerOptionsModal, setShowPlayerOptionsModal] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Refs for scrolling
  const scrollViewRef = useRef(null);
  
  // Skip to balance entry if we already have a gameId
  useEffect(() => {
    if (gameId && route.params?.gameName) {
      setStep(3);
      
      // Find game players and set them as selected
      const currentGame = games.find(game => game.id === gameId);
      if (currentGame && currentGame.players) {
        const gamePlayers = currentGame.players.map(p => 
          players.find(player => player.id === p.playerId)
        ).filter(Boolean);
        
        setSelectedPlayers(gamePlayers);
        
        // Initialize balance entries for all players
        const initialBalances = {};
        gamePlayers.forEach(player => {
          initialBalances[player.id] = '0';
        });
        setPlayerBalances(initialBalances);
      }
    }
  }, [gameId, route.params, games, players]);
  
  // Calculate total balance when player balances change
  useEffect(() => {
    const total = Object.values(playerBalances).reduce((sum, balance) => {
      const numBalance = balance === '' || balance === '-' ? 0 : parseFloat(balance) || 0;
      return sum + numBalance;
    }, 0);
    setTotalBalance(parseFloat(total.toFixed(2)));
  }, [playerBalances]);
  
  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (event) => {
        setKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        setEditingPlayerId(null);
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Auto-scroll to editing player
  useEffect(() => {
    if (editingPlayerId && keyboardVisible && scrollViewRef.current && step === 3) {
      setTimeout(() => {
        const playerIndex = selectedPlayers.findIndex(p => p.id === editingPlayerId);
        if (playerIndex !== -1) {
          const itemHeight = 80;
          const scrollPosition = playerIndex * itemHeight;
          
          scrollViewRef.current.scrollTo({
            y: scrollPosition,
            animated: true
          });
        }
      }, 300);
    }
  }, [editingPlayerId, keyboardVisible, selectedPlayers, step]);

  // Show player options modal (edit/delete)
  const showPlayerOptions = (player) => {
    setSelectedPlayerForEdit(player);
    setShowPlayerOptionsModal(true);
  };
  
  // Handle editing a player
  const handleEditPlayer = () => {
    setShowPlayerOptionsModal(false);
    setEditingPlayerName(selectedPlayerForEdit.name);
    setShowEditPlayerModal(true);
  };

  // Save edited player
  const saveEditedPlayer = () => {
    if (!editingPlayerName.trim()) {
      Alert.alert('Error', 'Please enter a player name');
      return;
    }
    
    // Check if name is already taken by another player
    const nameExists = players.some(
      player => player.id !== selectedPlayerForEdit.id && 
                player.name.toLowerCase() === editingPlayerName.trim().toLowerCase()
    );
    
    if (nameExists) {
      Alert.alert('Duplicate Name', 'Another player with this name already exists');
      return;
    }
    
    // Update player in Redux
    dispatch(updatePlayer({ 
      id: selectedPlayerForEdit.id, 
      name: editingPlayerName.trim() 
    }));
    
    setShowEditPlayerModal(false);
    setEditingPlayerName('');
    setSelectedPlayerForEdit(null);
  };
  
  // Handle deleting a player
  const handleDeletePlayer = () => {
    setShowPlayerOptionsModal(false);
    
    Alert.alert(
      'Delete Player',
      `Are you sure you want to delete ${selectedPlayerForEdit.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Remove from selected players if selected
            if (selectedPlayers.some(p => p.id === selectedPlayerForEdit.id)) {
              setSelectedPlayers(selectedPlayers.filter(p => p.id !== selectedPlayerForEdit.id));
              
              // Also remove their balance if they're in the balance list
              const updatedBalances = { ...playerBalances };
              delete updatedBalances[selectedPlayerForEdit.id];
              setPlayerBalances(updatedBalances);
            }
            
            // Delete from Redux
            dispatch(deletePlayer(selectedPlayerForEdit.id));
            setSelectedPlayerForEdit(null);
          }
        }
      ]
    );
  };
  
  // Generate a random color for player avatar
  const getRandomColor = () => {
    const colors = [
      '#3498DB', '#2ECC71', '#E74C3C', '#9B59B6', 
      '#F1C40F', '#1ABC9C', '#D35400', '#34495E'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Handle adding a player to the game
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
    
    // Add the player through Redux
    dispatch(addPlayer({ 
      name: newPlayerName.trim(),
      avatarColor: getRandomColor()
    }));
    
    setNewPlayerName('');
    setShowAddPlayerModal(false);
    
    Alert.alert('Success', 'Player added successfully!');
  };
  
  // Handle player selection
  const togglePlayerSelection = (player) => {
    const isSelected = selectedPlayers.some(p => p.id === player.id);
    
    if (isSelected) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
      
      // Also remove their balance if they're deselected
      const updatedBalances = { ...playerBalances };
      delete updatedBalances[player.id];
      setPlayerBalances(updatedBalances);
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
      
      // Initialize their balance to 0
      setPlayerBalances(prev => ({
        ...prev,
        [player.id]: '0'
      }));
    }
  };
  
  // Handle balance change for a player
  const handleBalanceChange = (playerId, value) => {
    // Handle negative sign separately
    if (value === '-') {
      setPlayerBalances({ ...playerBalances, [playerId]: value });
      return;
    }
    
    // For all other cases, validate input as a number
    const valueStr = String(value);
    // This regex allows decimal points and digits
    const regex = /^-?\d*\.?\d*$/;
    
    if (valueStr === '' || regex.test(valueStr)) {
      setPlayerBalances({ ...playerBalances, [playerId]: value });
    }
  };
  
  // Proceed to next step
  const handleNextStep = () => {
    if (step === 1) {
      if (!gameTitle.trim()) {
        Alert.alert('Error', 'Please enter a game title');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedPlayers.length < 2) {
        Alert.alert('Error', 'Please select at least 2 players');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (Math.abs(totalBalance) > 0.01) {
        Alert.alert(
          'Balances Don\'t Sum to Zero',
          `The sum of all balances is ${totalBalance.toFixed(2)}. Balances must sum to zero.`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Update balances in Redux
      Object.entries(playerBalances).forEach(([playerId, balance]) => {
        const numBalance = balance === '' || balance === '-' ? 0 : parseFloat(balance) || 0;
        dispatch(setPlayerBalance({ playerId, amount: numBalance }));
      });
      
      // If we're in game mode with a gameId, also store the balances with the game
      if (gameId) {
        dispatch(updateGameBalances({ 
          gameId, 
          balances: playerBalances 
        }));
      }
      
      // Navigate to settlement screen
      navigation.navigate('Settlement');
    }
  };
  
  // Go back to previous step or navigate back
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };
  
  // Render Game Title input (Step 1)
  const renderGameTitleStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Game Title</Text>
      <Text style={styles.stepDescription}>
        Enter a title for this poker game
      </Text>
      
      <TextInput
        style={styles.titleInput}
        placeholder="e.g., Friday Night Game"
        value={gameTitle}
        onChangeText={setGameTitle}
        autoFocus
      />
    </View>
  );
  
  // Render Players selection (Step 2)
  const renderPlayersStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Select Players</Text>
        <TouchableOpacity
          style={styles.addPlayerButton}
          onPress={() => setShowAddPlayerModal(true)}
        >
          <MaterialIcons name="person-add" size={20} color="white" />
          <Text style={styles.addPlayerButtonText}>Add Player</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.stepDescription}>
        Select all players who participated in this game.
        Long press a player to edit or delete.
      </Text>
      
      <FlatList
        data={players}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.playerItem,
              selectedPlayers.some(p => p.id === item.id) && styles.selectedPlayerItem
            ]}
            onPress={() => togglePlayerSelection(item)}
            onLongPress={() => showPlayerOptions(item)}
            delayLongPress={500}
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
            
            <View style={styles.playerActions}>
              <TouchableOpacity
                style={styles.playerActionButton}
                onPress={() => showPlayerOptions(item)}
              >
                <MaterialIcons name="more-vert" size={20} color="#7F8C8D" />
              </TouchableOpacity>
              
              <View style={[
                styles.checkbox,
                selectedPlayers.some(p => p.id === item.id) && styles.checkboxSelected
              ]}>
                {selectedPlayers.some(p => p.id === item.id) && (
                  <MaterialIcons name="check" size={18} color="white" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No players available</Text>
            <TouchableOpacity
              style={styles.addFirstPlayerButton}
              onPress={() => setShowAddPlayerModal(true)}
            >
              <Text style={styles.addFirstPlayerText}>Add First Player</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      <View style={styles.selectionSummary}>
        <Text style={styles.selectionText}>
          {selectedPlayers.length} player{selectedPlayers.length !== 1 ? 's' : ''} selected
        </Text>
      </View>
    </View>
  );
  
  // Check if a balance is positive or negative for styling
  const getBalanceType = (balance) => {
    if (balance === '' || balance === '0') return 'neutral';
    if (balance === '-') return 'negative';
    
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) return 'neutral';
    if (numBalance > 0) return 'positive';
    if (numBalance < 0) return 'negative';
    return 'neutral';
  };
  
  // SIMPLIFIED Render Balances input (Step 3)
  const renderBalancesStep = () => {
    // Calculate available height for the list
    const availableHeight = keyboardVisible 
      ? height - keyboardHeight - 250 // Leave space for header and keyboard
      : height - 300; // Normal height when keyboard is hidden

    return (
      <View style={styles.balancesContainer}>
        {/* Fixed Header */}
        <View style={styles.balancesHeader}>
          <Text style={styles.stepTitle}>Enter Balances</Text>
          <Text style={styles.stepDescription}>
            Enter the final balance for each player (positive for winners, negative for losers)
          </Text>
          
          <View style={styles.balanceSummary}>
            <Text style={styles.balanceSummaryLabel}>Balance Sum</Text>
            <Text style={[
              styles.balanceSummaryValue,
              Math.abs(totalBalance) < 0.01 ? styles.balanceEven : styles.balanceUneven
            ]}>
              ${totalBalance.toFixed(2)}
            </Text>
          </View>
        </View>
        
        {/* Scrollable Balance List */}
        <FlatList
          ref={scrollViewRef}
          data={selectedPlayers}
          keyExtractor={(item) => item.id}
          style={[styles.balancesList, { maxHeight: availableHeight }]}
          contentContainerStyle={styles.balancesListContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          renderItem={({ item, index }) => {
            const balance = playerBalances[item.id] !== undefined ? playerBalances[item.id] : '0';
            const isEditing = editingPlayerId === item.id;
            const balanceType = getBalanceType(balance);
            
            return (
              <View style={styles.balanceItem}>
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
                
                <View style={styles.balanceInputContainer}>
                  <TouchableOpacity
                    style={[
                      styles.signButton,
                      balanceType === 'negative' ? styles.negativeButton : styles.positiveButton
                    ]}
                    onPress={() => {
                      const currentVal = playerBalances[item.id] || '0';
                      const numValue = parseFloat(currentVal) || 0;
                      
                      if (!isNaN(numValue) && numValue !== 0) {
                        handleBalanceChange(item.id, -numValue);
                      } else if (currentVal === '-') {
                        handleBalanceChange(item.id, '');
                      } else {
                        handleBalanceChange(item.id, '-');
                      }
                    }}
                  >
                    <Text style={styles.signButtonText}>
                      {balanceType === 'negative' ? '-' : '+'}
                    </Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={[
                      styles.balanceInput,
                      balanceType === 'positive' ? styles.positiveBalance : 
                      balanceType === 'negative' ? styles.negativeBalance : null,
                      isEditing && styles.focusedInput
                    ]}
                    keyboardType="decimal-pad"
                    value={balance === '-' ? '' : String(Math.abs(parseFloat(balance) || 0))}
                    onChangeText={(value) => {
                      if (balanceType === 'negative' && value !== '' && value !== '0') {
                        handleBalanceChange(item.id, -Math.abs(parseFloat(value) || 0));
                      } else {
                        handleBalanceChange(item.id, value);
                      }
                    }}
                    onFocus={() => setEditingPlayerId(item.id)}
                    selectTextOnFocus
                    placeholder="0.00"
                    returnKeyType={index < selectedPlayers.length - 1 ? "next" : "done"}
                    onSubmitEditing={() => {
                      if (index < selectedPlayers.length - 1) {
                        setEditingPlayerId(selectedPlayers[index + 1].id);
                      } else {
                        setEditingPlayerId(null);
                        Keyboard.dismiss();
                      }
                    }}
                  />
                </View>
              </View>
            );
          }}
        />
        
        {/* Fixed Footer */}
        <View style={styles.balanceNote}>
          <MaterialIcons name="info-outline" size={20} color="#7F8C8D" />
          <Text style={styles.balanceNoteText}>
            The sum of all balances must equal zero
          </Text>
        </View>
      </View>
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
            onPress={handleBack}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {gameTitle || 'New Settlement'}
          </Text>
          
          <View style={styles.spacer} />
        </View>
        
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.activeStepDot]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 2 && styles.activeStepDot]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step >= 3 && styles.activeStepDot]} />
        </View>
      </LinearGradient>
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {step === 1 && renderGameTitleStep()}
        {step === 2 && renderPlayersStep()}
        {step === 3 && renderBalancesStep()}
        
        {/* Bottom buttons - hide when keyboard is visible on balance step */}
        {(step !== 3 || !keyboardVisible) && (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextStep}
            >
              <Text style={styles.nextButtonText}>
                {step < 3 ? 'Continue' : 'Calculate Settlements'}
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
      
      {/* Modals remain the same */}
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
              placeholder="Player name"
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
                  styles.addButton,
                  !newPlayerName.trim() && styles.disabledButton
                ]}
                onPress={handleAddPlayer}
                disabled={!newPlayerName.trim()}
              >
                <Text style={styles.addButtonText}>Add Player</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showEditPlayerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditPlayerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Player</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Player name"
              value={editingPlayerName}
              onChangeText={setEditingPlayerName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditingPlayerName('');
                  setShowEditPlayerModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.addButton,
                  !editingPlayerName.trim() && styles.disabledButton
                ]}
                onPress={saveEditedPlayer}
                disabled={!editingPlayerName.trim()}
              >
                <Text style={styles.addButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={showPlayerOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPlayerOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.playerOptionsModal}>
            {selectedPlayerForEdit && (
              <>
                <View style={styles.playerOptionsHeader}>
                  <View 
                    style={[
                      styles.avatarLarge, 
                      { backgroundColor: selectedPlayerForEdit.avatarColor || '#3498DB' }
                    ]}
                  >
                    <Text style={styles.avatarLargeText}>
                      {selectedPlayerForEdit.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.playerOptionsName}>{selectedPlayerForEdit.name}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.playerOptionItem}
                  onPress={handleEditPlayer}
                >
                  <MaterialIcons name="edit" size={24} color="#3498DB" />
                  <Text style={styles.playerOptionText}>Edit Player</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.playerOptionItem}
                  onPress={handleDeletePlayer}
                >
                  <MaterialIcons name="delete" size={24} color="#E74C3C" />
                  <Text style={[styles.playerOptionText, { color: '#E74C3C' }]}>Delete Player</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.playerOptionItem, styles.playerOptionCancel]}
                  onPress={() => setShowPlayerOptionsModal(false)}
                >
                  <Text style={styles.playerOptionCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
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
  spacer: {
    width: 34,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeStepDot: {
    backgroundColor: 'white',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 20,
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498DB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addPlayerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
  titleInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
  },
  playerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerActionButton: {
    padding: 5,
    marginRight: 10,
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
  selectionSummary: {
    padding: 15,
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  
  // SIMPLIFIED BALANCE STEP STYLES
  balancesContainer: {
    flex: 1,
  },
  balancesHeader: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#F0F4F8',
  },
  balanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  balanceSummaryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  balanceSummaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceEven: {
    color: '#2ECC71',
  },
  balanceUneven: {
    color: '#E74C3C',
  },
  balancesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balancesListContent: {
    paddingVertical: 10,
  },
  balanceItem: {
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
  balanceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  positiveButton: {
    backgroundColor: '#2ECC71',
  },
  negativeButton: {
    backgroundColor: '#E74C3C',
  },
  signButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginRight: 2,
  },
  balanceInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#FAFAFA',
  },
  focusedInput: {
    borderWidth: 2,
    borderColor: '#3498DB',
    backgroundColor: '#FFFFFF',
  },
  positiveBalance: {
    borderColor: '#2ECC71',
    color: '#2ECC71',
  },
  negativeBalance: {
    borderColor: '#E74C3C',
    color: '#E74C3C',
  },
  balanceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9F9',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  balanceNoteText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 10,
  },
  
  buttonsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    backgroundColor: 'white',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#3498DB',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
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
  addButton: {
    backgroundColor: '#3498DB',
    marginLeft: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  
  // Player options modal
  playerOptionsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  playerOptionsHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarLargeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  playerOptionsName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  playerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  playerOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#2C3E50',
  },
  playerOptionCancel: {
    justifyContent: 'center',
    marginTop: 10,
    borderBottomWidth: 0,
  },
  playerOptionCancelText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default PreSettlementScreen;