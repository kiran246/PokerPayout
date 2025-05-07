import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { deleteTransaction } from '../store/settlementSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import BuyInSummary from '../components/BuyInSummary';

const GameLedgerScreen = ({ route, navigation }) => {
  const { gameId, isHistorical = false } = route.params || {};
  const dispatch = useDispatch();
  const { players } = useSelector(state => state.players);
  const { sessionId, games, gameLog, history } = useSelector(state => state.settlements);
  
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Find the current game
  let currentGame = gameId ? games.find(game => game.id === gameId) : null;
  let gameTransactions = [];
  let isCompleted = false;

  // If the game is historical or we can't find it in current games
  if (isHistorical || !currentGame) {
    // Search through history sessions
    for (const session of history) {
      if (session.games) {
        const histGame = session.games.find(game => game.id === gameId);
        if (histGame) {
          currentGame = histGame;
          // Get transactions from the session's gameLog that belong to this game
          gameTransactions = session.gameLog ? session.gameLog.filter(t => t.gameId === gameId) : [];
          isCompleted = true;
          break;
        }
      }
    }
  }

  // If the game is found in current games but has an endTime, mark it as completed
  if (currentGame && currentGame.endTime) {
    isCompleted = true;
  }
  
  // Filter transactions by game if gameId is provided, otherwise show all session transactions
  let filteredTransactions = gameId
    ? gameLog.filter(transaction => transaction.gameId === gameId)
    : gameLog.filter(transaction => !transaction.gameId);
  
  // If we found the game in history, use gameTransactions instead of the filtered gameLog
  if (gameTransactions.length > 0) {
    filteredTransactions = gameTransactions;
  }
  
  // Sort transactions by timestamp, newest first
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  // Get player by ID
  const getPlayer = (playerId) => {
    return players.find(player => player.id === playerId);
  };
  
  // Calculate player statistics from transactions
  const getPlayerStats = () => {
    const playerStats = {};
    
    // Initialize with players who participated in the game
    if (currentGame && currentGame.players) {
      currentGame.players.forEach(player => {
        playerStats[player.playerId] = {
          buyIns: 0,
          buyInCount: 0,
          cashOuts: 0,
          cashOutCount: 0,
          net: 0
        };
      });
    }
    
    // Process all transactions
    sortedTransactions.forEach(transaction => {
      const { playerId, type, amount } = transaction;
      
      // Initialize player stats if not already present
      if (!playerStats[playerId]) {
        playerStats[playerId] = {
          buyIns: 0,
          buyInCount: 0,
          cashOuts: 0,
          cashOutCount: 0,
          net: 0
        };
      }
      
      // Parse amount to ensure it's a number
      const numAmount = Number(amount);
      
      // Update stats based on transaction type
      if (type === 'buy-in') {
        playerStats[playerId].buyIns += numAmount;
        playerStats[playerId].buyInCount += 1;
        playerStats[playerId].net -= numAmount; // Buy-ins decrease net (money spent)
      } else if (type === 'cash-out') {
        playerStats[playerId].cashOuts += numAmount;
        playerStats[playerId].cashOutCount += 1;
        playerStats[playerId].net += numAmount; // Cash-outs increase net (money received)
      }
    });
    
    return playerStats;
  };
  
  const playerStats = getPlayerStats();
  
  // Get overall game summary
  const getGameSummary = () => {
    // Default values to ensure we always have numbers
    let totalBuyIns = 0;
    let totalCashOuts = 0;
    let uniquePlayers = new Set();
    let buyInAmounts = new Set();
    
    // Calculate from transactions
    if (sortedTransactions.length > 0) {
      // Calculate buy-ins
      sortedTransactions
        .filter(t => t.type === 'buy-in')
        .forEach(t => {
          const amount = Number(t.amount);
          totalBuyIns += amount;
          buyInAmounts.add(amount);
        });
        
      // Calculate cash-outs
      sortedTransactions
        .filter(t => t.type === 'cash-out')
        .forEach(t => {
          totalCashOuts += Number(t.amount);
        });
        
      // Get unique player IDs
      sortedTransactions.forEach(t => uniquePlayers.add(t.playerId));
    }
    
    // Default buy-in from game settings
    const defaultBuyIn = currentGame?.buyIn || 0;
    
    // If there are no buy-in amounts but there is a default buy-in, add it
    if (buyInAmounts.size === 0 && defaultBuyIn > 0) {
      buyInAmounts.add(defaultBuyIn);
    }
      
    return {
      totalBuyIns,
      totalCashOuts,
      moneyInPlay: totalBuyIns - totalCashOuts,
      transactionCount: sortedTransactions.length,
      playersWithTransactions: uniquePlayers.size,
      buyInAmounts: Array.from(buyInAmounts),
      defaultBuyIn
    };
  };
  
  const summary = getGameSummary();
  
  // Get settlements from session history if available
  const getSettlements = () => {
    if (isHistorical || isCompleted) {
      // Look for settlements in history
      for (const session of history) {
        if (session.games && session.games.some(g => g.id === gameId)) {
          return session.settlements || [];
        }
      }
    }
    return [];
  };
  
  const gameSettlements = getSettlements();

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
          {isCompleted ? (
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => navigation.navigate('SessionShare', { 
                session: { 
                  id: gameId,
                  date: currentGame?.startTime || new Date().toISOString(),
                  balances: {},
                  settlements: gameSettlements
                }
              })}
            >
              <MaterialIcons name="share" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('BuyInScreen', { gameId })}
            >
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.container}>
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
            
            {/* New section for buy-in amounts */}
            <View style={styles.buyInAmountsSection}>
              <Text style={styles.buyInAmountsLabel}>Buy-in Amounts</Text>
              <View style={styles.buyInAmountsContainer}>
                {summary.defaultBuyIn > 0 && (
                  <View style={styles.buyInAmountTag}>
                    <Text style={styles.buyInAmountText}>
                      Default: ${summary.defaultBuyIn.toFixed(2)}
                    </Text>
                  </View>
                )}
                {summary.buyInAmounts.map((amount, index) => (
                  <View key={index} style={styles.buyInAmountTag}>
                    <Text style={styles.buyInAmountText}>
                      ${amount.toFixed(2)}
                    </Text>
                  </View>
                ))}
                {summary.buyInAmounts.length === 0 && summary.defaultBuyIn === 0 && (
                  <Text style={styles.noBuyInsText}>No buy-ins recorded</Text>
                )}
              </View>
            </View>
          </View>
        </View>
        
        {/* BuyInSummary only shown for active games */}
        {!isCompleted && <BuyInSummary navigation={navigation} gameId={gameId} isCompleted={isCompleted} />}
        
        {/* Player Summary Section */}
        <View style={styles.playerSummaryContainer}>
          <Text style={styles.sectionTitle}>Player Summary</Text>
          
          <FlatList
            data={Object.keys(playerStats).map(playerId => ({
              id: playerId,
              ...playerStats[playerId],
              player: getPlayer(playerId)
            }))}
            keyExtractor={item => item.id}
            renderItem={({ item }) => {
              const playerName = item.player ? item.player.name : 'Unknown Player';
              const playerColor = item.player ? item.player.avatarColor : '#7F8C8D';
              
              return (
                <View style={styles.playerSummaryItem}>
                  <View style={styles.playerSummaryHeader}>
                    <View style={styles.playerInfo}>
                      <View style={[styles.miniAvatar, { backgroundColor: playerColor }]}>
                        <Text style={styles.miniAvatarText}>
                          {playerName.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.playerSummaryName}>{playerName}</Text>
                    </View>
                    
                    <Text style={[
                      styles.playerNetAmount,
                      item.net > 0 ? styles.positiveAmount : 
                      item.net < 0 ? styles.negativeAmount : styles.neutralAmount
                    ]}>
                      {item.net > 0 ? '+' : ''}${item.net.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.playerSummaryDetails}>
                    <View style={styles.playerSummaryDetail}>
                      <Text style={styles.playerSummaryLabel}>Buy-ins:</Text>
                      <Text style={styles.playerSummaryValue}>
                        ${item.buyIns.toFixed(2)} ({item.buyInCount})
                      </Text>
                    </View>
                    
                    <View style={styles.playerSummaryDetail}>
                      <Text style={styles.playerSummaryLabel}>Cash-outs:</Text>
                      <Text style={styles.playerSummaryValue}>
                        ${item.cashOuts.toFixed(2)} ({item.cashOutCount})
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No player data available</Text>
              </View>
            }
          />
        </View>
        
        {/* Settlements section */}
        {isCompleted && gameSettlements.length > 0 && (
          <View style={styles.settlementsContainer}>
            <Text style={styles.sectionTitle}>Final Settlements</Text>
            
            <FlatList
              data={gameSettlements}
              renderItem={({ item, index }) => {
                const fromPlayer = getPlayer(item.from);
                const toPlayer = getPlayer(item.to);
                
                return (
                  <View style={styles.settlementItem}>
                    <View style={styles.settlementHeader}>
                      <View style={styles.settlementNumber}>
                        <Text style={styles.settlementNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.settlementAmount}>${item.amount.toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.settlementParties}>
                      <View style={styles.partyContainer}>
                        <View 
                          style={[
                            styles.miniAvatar, 
                            { backgroundColor: fromPlayer?.avatarColor || '#7F8C8D' }
                          ]}
                        >
                          <Text style={styles.miniAvatarText}>
                            {fromPlayer ? fromPlayer.name.substring(0, 2).toUpperCase() : 'UK'}
                          </Text>
                        </View>
                        <View style={styles.partyInfo}>
                          <Text style={styles.partyAction}>Pays</Text>
                          <Text style={styles.partyName}>{fromPlayer?.name || 'Unknown Player'}</Text>
                        </View>
                      </View>
                      
                      <MaterialIcons name="arrow-forward" size={24} color="#7F8C8D" style={styles.arrowIcon} />
                      
                      <View style={styles.partyContainer}>
                        <View 
                          style={[
                            styles.miniAvatar, 
                            { backgroundColor: toPlayer?.avatarColor || '#7F8C8D' }
                          ]}
                        >
                          <Text style={styles.miniAvatarText}>
                            {toPlayer ? toPlayer.name.substring(0, 2).toUpperCase() : 'UK'}
                          </Text>
                        </View>
                        <View style={styles.partyInfo}>
                          <Text style={styles.partyAction}>Receives</Text>
                          <Text style={styles.partyName}>{toPlayer?.name || 'Unknown Player'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              }}
              keyExtractor={(item, index) => `settlement-${index}`}
              scrollEnabled={false}
              ListEmptyComponent={null}
            />
          </View>
        )}
      </ScrollView>
      
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
              {!isCompleted && (
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
                            dispatch(deleteTransaction({ transactionId: selectedTransaction.id }));
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
              )}
              
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
      
      {/* Share Button for Completed Games */}
      {isCompleted && (
        <View style={styles.floatingShareContainer}>
          <TouchableOpacity
            style={styles.floatingShareButton}
            onPress={() => navigation.navigate('SessionShare', { 
              session: { 
                id: gameId,
                date: currentGame?.startTime || new Date().toISOString(),
                balances: {},
                settlements: gameSettlements
              }
            })}
          >
            <MaterialIcons name="share" size={24} color="white" />
            <Text style={styles.floatingShareText}>Share Results</Text>
          </TouchableOpacity>
        </View>
      )}
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
  shareButton: {
    padding: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  summaryContainer: {
    marginBottom: 20,
    padding: 15,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    paddingHorizontal: 5,
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
    marginBottom: 15,
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
  positiveAmount: {
    color: '#2ECC71',
  },
  negativeAmount: {
    color: '#E74C3C',
  },
  // New styles for buy-in amounts
  buyInAmountsSection: {
    marginTop: 5,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  buyInAmountsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  buyInAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  buyInAmountTag: {
    backgroundColor: '#E1F0FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BDE9F7',
  },
  buyInAmountText: {
    color: '#3498DB',
    fontWeight: '600',
    fontSize: 14,
  },
  noBuyInsText: {
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
  // Settlements section styles
  settlementsContainer: {
    padding: 15,
    paddingTop: 0,
    marginBottom: 20,
  },
  settlementItem: {
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
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  settlementNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settlementNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  settlementAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  settlementParties: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  partyInfo: {
    flex: 1,
  },
  partyAction: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  partyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
  },
  arrowIcon: {
    marginHorizontal: 10,
  },
  // Modal styles
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
  },
  transactionDetails: {},
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
    justifyContent: 'flex-end',
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
  // Floating share button
  floatingShareContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
    alignItems: 'center',
  },
  floatingShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  floatingShareText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  // Styles for player summary
  playerSummaryContainer: {
    padding: 15,
    paddingTop: 0,
    marginBottom: 20,
  },
  playerSummaryItem: {
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
  playerSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  playerSummaryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  playerNetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  neutralAmount: {
    color: '#7F8C8D',
  },
  playerSummaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerSummaryDetail: {
    flex: 1,
  },
  playerSummaryLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  playerSummaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginTop: 3,
  },
});

export default GameLedgerScreen;