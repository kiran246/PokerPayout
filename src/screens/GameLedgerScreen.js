// src/screens/GameLedgerScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const GameLedgerScreen = ({ route, navigation }) => {
  const { gameId } = route.params || {};
  const dispatch = useDispatch();
  const { players } = useSelector(state => state.players);
  const { sessionId, games, gameLog } = useSelector(state => state.settlements);
  
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Get current game if gameId is provided
  const currentGame = gameId ? games.find(game => game.id === gameId) : null;
  
  // Filter transactions by game if gameId is provided, otherwise show all session transactions
  const filteredTransactions = gameId
    ? gameLog.filter(transaction => transaction.gameId === gameId)
    : gameLog.filter(transaction => !transaction.gameId);
  
  // Sort transactions by timestamp, newest first
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  // Get player by ID
  const getPlayer = (playerId) => {
    return players.find(player => player.id === playerId);
  };
  
  // Calculate current balances for all players
  const calculateBalances = () => {
    const balances = {};
    
    // Initialize balances for all players
    players.forEach(player => {
      balances[player.id] = 0;
    });
    
    // Apply all transactions
    sortedTransactions.forEach(transaction => {
      if (transaction.type === 'buy-in') {
        balances[transaction.playerId] -= transaction.amount;
      } else if (transaction.type === 'cash-out') {
        balances[transaction.playerId] += transaction.amount;
      }
    });
    
    return balances;
  };
  
  const currentBalances = calculateBalances();
  
  // Get overall game summary
  const getGameSummary = () => {
    const totalBuyIns = sortedTransactions
      .filter(t => t.type === 'buy-in')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalCashOuts = sortedTransactions
      .filter(t => t.type === 'cash-out')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return {
      totalBuyIns,
      totalCashOuts,
      moneyInPlay: totalBuyIns - totalCashOuts,
      transactionCount: sortedTransactions.length,
      playersWithTransactions: new Set(sortedTransactions.map(t => t.playerId)).size
    };
  };
  
  const summary = getGameSummary();
  
  // Render transaction item
  const renderTransactionItem = ({ item }) => {
    const player = getPlayer(item.playerId);
    const isPositive = item.type === 'cash-out';
    
    return (
      <TouchableOpacity
        style={styles.transactionItem}
        onPress={() => {
          setSelectedTransaction(item);
          setShowTransactionDetails(true);
        }}
      >
        <View style={styles.transactionHeader}>
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
            <View style={styles.transactionDetails}>
              <Text style={styles.playerName}>
                {player ? player.name : 'Unknown Player'}
              </Text>
              <Text style={styles.transactionType}>
                {item.type === 'buy-in' ? 'Buy-In' : 'Cash-Out'}
              </Text>
            </View>
          </View>
          
          <Text style={[
            styles.transactionAmount,
            isPositive ? styles.positiveAmount : styles.negativeAmount
          ]}>
            {isPositive ? '+' : '-'}${item.amount.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.transactionFooter}>
          <Text style={styles.transactionTime}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Render list of current player balances
  const renderBalancesList = () => {
    // Convert balances to array for sorting
    const balancesArray = Object.entries(currentBalances)
      .map(([playerId, balance]) => {
        const player = getPlayer(playerId);
        return {
          id: playerId,
          name: player ? player.name : 'Unknown Player',
          avatarColor: player ? player.avatarColor || '#3498DB' : '#7F8C8D',
          balance
        };
      })
      .filter(item => item.balance !== 0)
      .sort((a, b) => b.balance - a.balance);
    
    return (
      <View style={styles.balancesContainer}>
        <Text style={styles.sectionTitle}>Current Balances</Text>
        
        {balancesArray.length > 0 ? (
          <FlatList
            data={balancesArray}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.balanceItem}>
                <View style={styles.playerInfo}>
                  <View 
                    style={[
                      styles.miniAvatar, 
                      { backgroundColor: item.avatarColor }
                    ]}
                  >
                    <Text style={styles.miniAvatarText}>
                      {item.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.playerName}>{item.name}</Text>
                </View>
                
                <Text style={[
                  styles.balanceAmount,
                  item.balance > 0 ? styles.positiveAmount : styles.negativeAmount
                ]}>
                  {item.balance > 0 ? '+' : ''}${item.balance.toFixed(2)}
                </Text>
              </View>
            )}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No balances to display</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No balances to display</Text>
          </View>
        )}
      </View>
    );
  };
  // Render game summary card
  const renderGameSummary = () => {
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>
          {currentGame ? currentGame.name : 'Session'} Summary
        </Text>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Buy-ins</Text>
              <Text style={styles.summaryValue}>${summary.totalBuyIns.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Cash-outs</Text>
              <Text style={styles.summaryValue}>${summary.totalCashOuts.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Money In Play</Text>
              <Text style={[
                styles.summaryValue,
                summary.moneyInPlay > 0 ? styles.positiveAmount : 
                summary.moneyInPlay < 0 ? styles.negativeAmount : null
              ]}>
                ${summary.moneyInPlay.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Active Players</Text>
              <Text style={styles.summaryValue}>{summary.playersWithTransactions}</Text>
            </View>
          </View>
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
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentGame ? currentGame.name : 'Session Ledger'}
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('BuyInScreen', { gameId })}
          >
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <View style={styles.container}>
        {renderGameSummary()}
        
        {renderBalancesList()}
        
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          
          <FlatList
            data={sortedTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.transactionsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No transactions recorded yet</Text>
                <TouchableOpacity
                  style={styles.addTransactionButton}
                  onPress={() => navigation.navigate('BuyInScreen', { gameId })}
                >
                  <Text style={styles.addTransactionButtonText}>Record Buy-In</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      </View>
      
      {/* Transaction details modal */}
      <Modal
        visible={showTransactionDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTransactionDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transaction Details</Text>
            
            {selectedTransaction && (
              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Player:</Text>
                  <Text style={styles.detailValue}>
                    {getPlayer(selectedTransaction.playerId)?.name || 'Unknown Player'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransaction.type === 'buy-in' ? 'Buy-In' : 'Cash-Out'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={[
                    styles.detailValue,
                    selectedTransaction.type === 'cash-out' ? styles.positiveAmount : styles.negativeAmount
                  ]}>
                    ${selectedTransaction.amount.toFixed(2)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTransaction.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTransaction.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
                
                {selectedTransaction.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Note:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.description}</Text>
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.deleteTransactionButton}
                onPress={() => {
                  Alert.alert(
                    'Delete Transaction',
                    'Are you sure you want to delete this transaction?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Delete', 
                        style: 'destructive',
                        onPress: () => {
                          dispatch(deleteTransaction(selectedTransaction.id));
                          setShowTransactionDetails(false);
                        }
                      }
                    ]
                  );
                }}
              >
                <MaterialIcons name="delete" size={20} color="#E74C3C" />
                <Text style={styles.deleteTransactionText}>Delete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTransactionDetails(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
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
  actionButton: {
    padding: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    padding: 15,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  balancesContainer: {
    marginBottom: 20,
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
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  miniAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveAmount: {
    color: '#2ECC71',
  },
  negativeAmount: {
    color: '#E74C3C',
  },
  transactionsContainer: {
    flex: 1,
  },
  transactionsList: {
    paddingBottom: 20,
  },
  transactionItem: {
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
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionDetails: {
    flexDirection: 'column',
  },
  transactionType: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  transactionTime: {
    fontSize: 12,
    color: '#7F8C8D',
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
    marginBottom: 15,
  },
  addTransactionButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  addTransactionButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    width: 80,
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  deleteTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  deleteTransactionText: {
    color: '#E74C3C',
    marginLeft: 5,
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default GameLedgerScreen;