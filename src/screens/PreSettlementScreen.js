import React, { useState, useEffect } from 'react';
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
  Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { startNewSession, setPlayerBalance } from '../store/settlementSlice';
import { addPlayer } from '../store/playerSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

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
  const [newPlayerName, setNewPlayerName] = useState('');
  const [totalBalance, setTotalBalance] = useState(0);
  
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
  
  // Generate a random color for player avatar
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
    
    // Actually add the player through Redux
    dispatch(addPlayer({ 
      name: newPlayerName.trim(),
      avatarColor: getRandomColor()
    }));
    
    setNewPlayerName('');
    setShowAddPlayerModal(false);
    
    // Show success message
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
          [
            { text: 'OK' }
          ]
        );
        return;
      }
      
      // Update balances in Redux
      Object.entries(playerBalances).forEach(([playerId, balance]) => {
        const numBalance = balance === '' || balance === '-' ? 0 : parseFloat(balance) || 0;
        dispatch(setPlayerBalance({ playerId, amount: numBalance }));
      });
      
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
        Select all players who participated in this game
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
              selectedPlayers.some(p => p.id === item.id) && styles.checkboxSelected
            ]}>
              {selectedPlayers.some(p => p.id === item.id) && (
                <MaterialIcons name="check" size={18} color="white" />
              )}
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
  
  // Render Balances input (Step 3)
  const renderBalancesStep = () => (
    <View style={styles.stepContainer}>
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
      
      <FlatList
        data={selectedPlayers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const balance = playerBalances[item.id] || '0';
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
                    // Toggle between positive and negative
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
                    balanceType === 'negative' ? styles.negativeBalance : null
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
                  selectTextOnFocus
                  placeholder="0.00"
                />
              </View>
            </View>
          );
        }}
      />
      
      <View style={styles.balanceNote}>
        <MaterialIcons name="info-outline" size={20} color="#7F8C8D" />
        <Text style={styles.balanceNoteText}>
          The sum of all balances must equal zero
        </Text>
      </View>
    </View>
  );
  
  // Helper function to check if a balance is positive or negative for styling
  const getBalanceType = (balance) => {
    if (balance === '' || balance === '0') return 'neutral';
    if (balance === '-') return 'negative';
    
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) return 'neutral';
    if (numBalance > 0) return 'positive';
    if (numBalance < 0) return 'negative';
    return 'neutral';
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {step === 1 && renderGameTitleStep()}
        {step === 2 && renderPlayersStep()}
        {step === 3 && renderBalancesStep()}
        
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
      </KeyboardAvoidingView>
      
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
    width: 34, // Same as back button size for balance
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
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
  balanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
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
  balanceItem: {
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
    borderRadius: 10,
    marginTop: 10,
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
    paddingVertical: 15,
    borderRadius: 10,
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
});

export default PreSettlementScreen;