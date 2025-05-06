import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  Switch
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { recordTransaction, addPlayerToGame, deleteTransaction, updateTransactionAmount } from '../store/settlementSlice';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BuyInScreen = ({ route, navigation }) => {
  const { gameId } = route.params || {};
  const dispatch = useDispatch();
  const { players } = useSelector(state => state.players);
  const { sessionId, games, gameLog } = useSelector(state => state.settlements);
  
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [buyInAmount, setBuyInAmount] = useState('');
  const [showBuyInModal, setShowBuyInModal] = useState(false);
  const [showBatchBuyInModal, setShowBatchBuyInModal] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [batchBuyInAmount, setBatchBuyInAmount] = useState('');
  const [useDefaultBuyIn, setUseDefaultBuyIn] = useState(true);
  
  // Custom buy-in amounts for specific players
  const [customBuyIns, setCustomBuyIns] = useState({});
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [tempCustomAmount, setTempCustomAmount] = useState('');
  
  // Edit transaction states
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Get current game if gameId is provided
  const currentGame = gameId ? games.find(game => game.id === gameId) : null;
  
  // Initialize buy-in amount from default when opening the modal
  useEffect(() => {
    if (showBuyInModal && selectedPlayerId) {
      if (useDefaultBuyIn) {
        if (customBuyIns[selectedPlayerId]) {
          // Use custom amount for this player if available
          setBuyInAmount(customBuyIns[selectedPlayerId].toString());
        } else if (currentGame && currentGame.buyIn > 0) {
          // Otherwise use the game default
          setBuyInAmount(currentGame.buyIn.toString());
        }
      }
    }
  }, [showBuyInModal, selectedPlayerId, useDefaultBuyIn, currentGame, customBuyIns]);
  
  // Initialize batch buy-in amount from default
  useEffect(() => {
    if (showBatchBuyInModal && useDefaultBuyIn && currentGame && currentGame.buyIn > 0) {
      setBatchBuyInAmount(currentGame.buyIn.toString());
    }
  }, [showBatchBuyInModal, useDefaultBuyIn, currentGame]);
  
  // Get buy-in transactions from game log
  const getBuyInTransactions = () => {
    return gameLog.filter(transaction => 
      transaction.type === 'buy-in' && 
      (!gameId || transaction.gameId === gameId)
    );
  };
  
  // Calculate total buy-ins for a player
  const getPlayerBuyIns = (playerId) => {
    const buyIns = getBuyInTransactions().filter(
      transaction => transaction.playerId === playerId
    );
    
    const total = buyIns.reduce((sum, transaction) => sum + transaction.amount, 0);
    
    return {
      count: buyIns.length,
      total,
      transactions: buyIns
    };
  };
  
  // Handle recording a new buy-in
  const handleRecordBuyIn = () => {
    if (!selectedPlayerId) {
      Alert.alert('Error', 'Please select a player');
      return;
    }
    
    const amount = parseFloat(buyInAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    // Record the transaction in the game ledger
    dispatch(recordTransaction({
      type: 'buy-in',
      playerId: selectedPlayerId,
      amount,
      gameId,
      description: `Buy-in for $${amount}`
    }));
    
    // If this is a game-specific buy-in, add player to game if not already added
    if (gameId) {
      dispatch(addPlayerToGame({
        gameId,
        playerId: selectedPlayerId,
        initialBuyIn: amount
      }));
    }
    
    // Reset form
    setBuyInAmount('');
    setSelectedPlayerId(null);
    setShowBuyInModal(false);
    
    // Show success message
    Alert.alert('Success', 'Buy-in recorded successfully');
  };
  
  // Handle batch buy-in for multiple players
  const handleBatchBuyIn = () => {
    if (selectedPlayerIds.length === 0) {
      Alert.alert('Error', 'Please select at least one player');
      return;
    }
    
    const defaultAmount = parseFloat(batchBuyInAmount);
    if (isNaN(defaultAmount) || defaultAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    // Record buy-ins for all selected players
    selectedPlayerIds.forEach(playerId => {
      // Use custom amount if available, otherwise use the default batch amount
      const buyInAmount = customBuyIns[playerId] || defaultAmount;
      
      // Record the transaction
      dispatch(recordTransaction({
        type: 'buy-in',
        playerId,
        amount: buyInAmount,
        gameId,
        description: `Buy-in for $${buyInAmount}`
      }));
      
      // Add player to game if game-specific
      if (gameId) {
        dispatch(addPlayerToGame({
          gameId,
          playerId,
          initialBuyIn: buyInAmount
        }));
      }
    });
    
    // Reset form
    setBatchBuyInAmount('');
    setSelectedPlayerIds([]);
    setCustomBuyIns({});
    setShowBatchBuyInModal(false);
    
    // Show success message
    Alert.alert('Success', `Recorded buy-ins for ${selectedPlayerIds.length} players`);
  };
  
  // Handle editing a transaction
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setShowEditModal(true);
  };
  
  // Save edited transaction
  const handleSaveEdit = () => {
    if (!editingTransaction) return;
    
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    // Dispatch action to update the transaction amount
    dispatch(updateTransactionAmount({
      transactionId: editingTransaction.id,
      newAmount: amount
    }));
    
    // Reset state
    setEditingTransaction(null);
    setEditAmount('');
    setShowEditModal(false);
    
    // Show success message
    Alert.alert('Success', 'Buy-in amount updated successfully');
  };
  
  // Handle customizing an individual player's buy-in amount
  const handleCustomizeAmount = () => {
    const amount = parseFloat(tempCustomAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    // Update the custom buy-in amount for this player
    setCustomBuyIns({
      ...customBuyIns,
      [selectedPlayerId]: amount
    });
    
    setTempCustomAmount('');
    setShowCustomizeModal(false);
  };
  
  // Toggle player selection for batch buy-in
  const togglePlayerSelection = (playerId) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    }
  };
  
  // Select all players for batch buy-in
  const selectAllPlayers = () => {
    setSelectedPlayerIds(players.map(player => player.id));
  };
  
  // Deselect all players
  const deselectAllPlayers = () => {
    setSelectedPlayerIds([]);
  };
  
  // Render player item for selection
  const renderPlayerItem = ({ item }) => {
    const playerBuyIns = getPlayerBuyIns(item.id);
    const isSelected = selectedPlayerId === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.playerItem,
          isSelected && styles.selectedPlayerItem
        ]}
        onPress={() => {
          setSelectedPlayerId(item.id);
          setShowBuyInModal(true);
        }}
        onLongPress={() => togglePlayerSelection(item.id)}
      >
        <View style={styles.playerInfo}>
          <View 
            style={[
              styles.avatar, 
              { backgroundColor: item.avatarColor || '#3498DB' }
            ]}
          >
            <Text style={styles.avatarText}>
              {item.name.split(' ').map(part => part.charAt(0)).join('').toUpperCase().substring(0, 2)}
            </Text>
          </View>
          <View style={styles.playerDetails}>
            <Text style={styles.playerName}>{item.name}</Text>
            <Text style={styles.buyInCount}>
              Buy-ins: {playerBuyIns.count} (Total: ${playerBuyIns.total.toFixed(2)})
            </Text>
            {customBuyIns[item.id] && (
              <Text style={styles.customAmount}>
                Custom buy-in: ${customBuyIns[item.id].toFixed(2)}
              </Text>
            )}
          </View>
        </View>
        <MaterialIcons name="add-circle" size={30} color="#3498DB" />
      </TouchableOpacity>
    );
  };
  
  // Render player item for batch selection
  const renderBatchPlayerItem = ({ item }) => {
    const isSelected = selectedPlayerIds.includes(item.id);
    const hasCustomAmount = !!customBuyIns[item.id];
    
    return (
      <TouchableOpacity
        style={[
          styles.batchPlayerItem,
          isSelected && styles.batchPlayerSelected
        ]}
        onPress={() => togglePlayerSelection(item.id)}
      >
        <View style={styles.playerInfo}>
          <View 
            style={[
              styles.miniAvatar, 
              { backgroundColor: item.avatarColor || '#3498DB' }
            ]}
          >
            <Text style={styles.miniAvatarText}>
              {item.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.playerBatchDetails}>
            <Text style={styles.playerName}>{item.name}</Text>
            {hasCustomAmount && (
              <Text style={styles.customAmount}>
                Custom: ${customBuyIns[item.id].toFixed(2)}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.batchItemActions}>
          {isSelected && (
            <TouchableOpacity
              style={styles.customizeButton}
              onPress={() => {
                // Set the currently selected player for customization
                setSelectedPlayerId(item.id);
                // Set the initial value for the custom amount input
                setTempCustomAmount(
                  customBuyIns[item.id] ? 
                  customBuyIns[item.id].toString() : 
                  batchBuyInAmount || (currentGame?.buyIn || '').toString()
                );
                setShowCustomizeModal(true);
              }}
            >
              <MaterialIcons name="edit" size={18} color="#3498DB" />
            </TouchableOpacity>
          )}
          
          <View style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected
          ]}>
            {isSelected && (
              <MaterialIcons name="check" size={16} color="white" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render buy-in history
  const renderBuyInHistory = () => {
    // Get all buy-ins for this session/game
    const buyIns = getBuyInTransactions();
    
    // Sort by timestamp, newest first
    buyIns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return (
      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Buy-In History</Text>
          
          <TouchableOpacity
            style={styles.batchBuyInButton}
            onPress={() => {
              setSelectedPlayerIds([]);
              setCustomBuyIns({});
              setShowBatchBuyInModal(true);
            }}
          >
            <Text style={styles.batchBuyInText}>Batch Buy-In</Text>
          </TouchableOpacity>
        </View>
        
        {buyIns.length > 0 ? (
          <FlatList
            data={buyIns}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const player = players.find(p => p.id === item.playerId);
              
              return (
                <View style={styles.buyInItem}>
                  <View style={styles.buyInHeader}>
                    <View style={styles.playerInfo}>
                      <View 
                        style={[
                          styles.miniAvatar, 
                          { backgroundColor: player ? player.avatarColor || '#3498DB' : '#7F8C8D' }
                        ]}
                      >
                        <Text style={styles.miniAvatarText}>
                          {player ? player.name.substring(0, 2).toUpperCase() : 'UK'}
                        </Text>
                      </View>
                      <Text style={styles.buyInPlayerName}>
                        {player ? player.name : 'Unknown Player'}
                      </Text>
                    </View>
                    <Text style={styles.buyInAmount}>${item.amount.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.buyInFooter}>
                    <Text style={styles.buyInTime}>
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                    
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditTransaction(item)}
                      >
                        <MaterialIcons name="edit" size={20} color="#3498DB" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                          Alert.alert(
                            'Delete Buy-In',
                            'Are you sure you want to delete this buy-in record?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Delete', 
                                style: 'destructive',
                                onPress: () => {
                                  dispatch(deleteTransaction({
                                    transactionId: item.id
                                  }));
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <MaterialIcons name="delete" size={20} color="#E74C3C" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No buy-ins recorded yet</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No buy-ins recorded yet</Text>
          </View>
        )}
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
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentGame ? `Buy-Ins: ${currentGame.name}` : 'Player Buy-Ins'}
          </Text>
          {currentGame && currentGame.buyIn > 0 && (
            <View style={styles.defaultBuyInBadge}>
              <Text style={styles.defaultBuyInText}>
                Default: ${currentGame.buyIn}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
      
      <View style={styles.container}>
        <View style={styles.playersContainer}>
          <Text style={styles.sectionTitle}>Select Player</Text>
          
          <FlatList
            data={players}
            renderItem={renderPlayerItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.playersList}
          />
        </View>
        
        {renderBuyInHistory()}
      </View>
      
      {/* Individual Buy-in Modal */}
      <Modal
        visible={showBuyInModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBuyInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Buy-In</Text>
            
            {selectedPlayerId && (
              <Text style={styles.selectedPlayerName}>
                {players.find(p => p.id === selectedPlayerId)?.name}
              </Text>
            )}
            
            {currentGame && currentGame.buyIn > 0 && (
              <View style={styles.defaultBuyInOption}>
                <Text style={styles.defaultBuyInLabel}>
                  Use default buy-in
                </Text>
                <Switch
                  value={useDefaultBuyIn}
                  onValueChange={setUseDefaultBuyIn}
                  trackColor={{ false: '#E0E0E0', true: '#BDE9C9' }}
                  thumbColor={useDefaultBuyIn ? '#2ECC71' : '#999'}
                />
              </View>
            )}
            
            <TextInput
              style={styles.amountInput}
              placeholder="Buy-in amount"
              keyboardType="decimal-pad"
              value={buyInAmount}
              onChangeText={setBuyInAmount}
              autoFocus={!useDefaultBuyIn}
              editable={!useDefaultBuyIn || (!currentGame || currentGame.buyIn <= 0)}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBuyInModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  (!buyInAmount || parseFloat(buyInAmount) <= 0) && styles.disabledButton
                ]}
                onPress={handleRecordBuyIn}
                disabled={!buyInAmount || parseFloat(buyInAmount) <= 0}
              >
                <Text style={styles.saveButtonText}>Record Buy-In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Batch Buy-in Modal */}
      <Modal
        visible={showBatchBuyInModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBatchBuyInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Batch Buy-In</Text>
            
            <Text style={styles.modalSubtitle}>Select Players</Text>
            
            <View style={styles.selectAllContainer}>
              <TouchableOpacity onPress={selectAllPlayers}>
                <Text style={styles.selectAllText}>Select All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={deselectAllPlayers}>
                <Text style={styles.deselectAllText}>Deselect All</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={players}
              keyExtractor={item => item.id}
              style={styles.batchPlayersList}
              renderItem={renderBatchPlayerItem}
            />
            
            {currentGame && currentGame.buyIn > 0 && (
              <View style={styles.defaultBuyInOption}>
                <Text style={styles.defaultBuyInLabel}>
                  Use default buy-in (${currentGame.buyIn})
                </Text>
                <Switch
                  value={useDefaultBuyIn}
                  onValueChange={setUseDefaultBuyIn}
                  trackColor={{ false: '#E0E0E0', true: '#BDE9C9' }}
                  thumbColor={useDefaultBuyIn ? '#2ECC71' : '#999'}
                />
              </View>
            )}
            
            <TextInput
              style={styles.amountInput}
              placeholder="Default buy-in amount for selected players"
              keyboardType="decimal-pad"
              value={batchBuyInAmount}
              onChangeText={setBatchBuyInAmount}
              editable={!useDefaultBuyIn || !currentGame || currentGame.buyIn <= 0}
            />
            
            <Text style={styles.helpText}>
              Tip: You can set custom amounts for individual players by selecting them and tapping the edit icon
            </Text>
            
            <View style={styles.selectedCountContainer}>
              <Text style={styles.selectedCountText}>
                {selectedPlayerIds.length} players selected
              </Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowBatchBuyInModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  (selectedPlayerIds.length === 0 || !batchBuyInAmount || parseFloat(batchBuyInAmount) <= 0) && styles.disabledButton
                ]}
                onPress={handleBatchBuyIn}
                disabled={selectedPlayerIds.length === 0 || !batchBuyInAmount || parseFloat(batchBuyInAmount) <= 0}
              >
                <Text style={styles.saveButtonText}>Record Buy-Ins</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Customize Amount Modal */}
      <Modal
        visible={showCustomizeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomizeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Customize Buy-In Amount</Text>
            
            {selectedPlayerId && (
              <Text style={styles.selectedPlayerName}>
                {players.find(p => p.id === selectedPlayerId)?.name}
              </Text>
            )}
            
            <TextInput
              style={styles.amountInput}
              placeholder="Custom buy-in amount"
              keyboardType="decimal-pad"
              value={tempCustomAmount}
              onChangeText={setTempCustomAmount}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  // If canceling, remove any custom amount for this player
                  const newCustomBuyIns = {...customBuyIns};
                  delete newCustomBuyIns[selectedPlayerId];
                  setCustomBuyIns(newCustomBuyIns);
                  setShowCustomizeModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Use Default</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  (!tempCustomAmount || parseFloat(tempCustomAmount) <= 0) && styles.disabledButton
                ]}
                onPress={handleCustomizeAmount}
                disabled={!tempCustomAmount || parseFloat(tempCustomAmount) <= 0}
              >
                <Text style={styles.saveButtonText}>Set Custom Amount</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Edit Transaction Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Buy-In Amount</Text>
            
            {editingTransaction && (
              <>
                <Text style={styles.selectedPlayerName}>
                  {players.find(p => p.id === editingTransaction.playerId)?.name || 'Unknown Player'}
                </Text>
                
                <Text style={styles.currentAmountText}>
                  Current amount: ${editingTransaction.amount.toFixed(2)}
                </Text>
                
                <TextInput
                  style={styles.amountInput}
                  placeholder="New buy-in amount"
                  keyboardType="decimal-pad"
                  value={editAmount}
                  onChangeText={setEditAmount}
                  autoFocus
                />
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  (!editAmount || parseFloat(editAmount) <= 0) && styles.disabledButton
                ]}
                onPress={handleSaveEdit}
                disabled={!editAmount || parseFloat(editAmount) <= 0}
              >
                <Text style={styles.saveButtonText}>Update Amount</Text>
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
    paddingTop: 15,
    paddingBottom: 15,
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
  defaultBuyInBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  defaultBuyInText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  playersContainer: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  playersList: {
    paddingBottom: 10,
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
  playerDetails: {
    flex: 1,
  },
  playerBatchDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  buyInCount: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  customAmount: {
    fontSize: 14,
    color: '#E67E22',
    fontWeight: '500',
  },
  historyContainer: {
    flex: 1,
    padding: 15,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  batchBuyInButton: {
    backgroundColor: '#2ECC71',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  batchBuyInText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buyInItem: {
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
  buyInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  miniAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  miniAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buyInPlayerName: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  buyInAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  buyInFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyInTime: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  deleteButton: {
    padding: 5,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  selectedPlayerName: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '500',
    marginBottom: 15,
    textAlign: 'center',
  },
  currentAmountText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 10,
    textAlign: 'center',
  },
  defaultBuyInOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  defaultBuyInLabel: {
    fontSize: 16,
    color: '#2C3E50',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  helpText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F4F8',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#3498DB',
    marginLeft: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  selectAllText: {
    color: '#3498DB',
    fontSize: 14,
    fontWeight: '500',
  },
  deselectAllText: {
    color: '#7F8C8D',
    fontSize: 14,
    fontWeight: '500',
  },
  batchPlayersList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  batchPlayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  batchPlayerSelected: {
    backgroundColor: '#E1F0FF',
  },
  batchItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customizeButton: {
    padding: 8,
    marginRight: 5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BDC3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  selectedCountContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedCountText: {
    fontSize: 14,
    color: '#7F8C8D',
  }
});

export default BuyInScreen;