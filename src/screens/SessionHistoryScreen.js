import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Share,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
  Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setHistory } from '../store/settlementSlice';
import { loadHistory } from '../api/storage';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const SessionHistoryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { history } = useSelector(state => state.settlements);
  const { players } = useSelector(state => state.players);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'week', 'month', 'year'
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    // Load history from storage when component mounts
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const storedHistory = await loadHistory();
        if (storedHistory.length > 0) {
          dispatch(setHistory(storedHistory));
        }
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setIsLoading(false);
        
        // Start entrance animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          })
        ]).start();
      }
    };
    
    fetchHistory();
  }, [dispatch, fadeAnim, slideAnim]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show full date
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown Player';
  };
  
  const getPlayerAvatar = (playerId) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return '#7F8C8D'; // Default gray for unknown players
    return player.avatarColor || getRandomColor();
  };
  
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
  
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Convert any balance to a numeric value
  const getNumericBalance = (balance) => {
    if (balance === '' || balance === '-') return 0;
    return typeof balance === 'string' ? parseFloat(balance) || 0 : balance || 0;
  };
  
  const getTotalTransactionAmount = (settlements) => {
    if (!settlements || settlements.length === 0) return 0;
    return settlements.reduce((sum, settlement) => sum + settlement.amount, 0);
  };
  
  const getSessionStats = (session) => {
    if (!session) return { winnerCount: 0, loserCount: 0, biggestWinner: null, biggestLoser: null };
    
    const balances = session.balances;
    const winners = Object.entries(balances)
      .map(([id, balance]) => [id, getNumericBalance(balance)])
      .filter(([_, balance]) => balance > 0);
      
    const losers = Object.entries(balances)
      .map(([id, balance]) => [id, getNumericBalance(balance)])
      .filter(([_, balance]) => balance < 0);
    
    let biggestWinner = { id: null, amount: 0 };
    let biggestLoser = { id: null, amount: 0 };
    
    winners.forEach(([id, amount]) => {
      if (amount > biggestWinner.amount) {
        biggestWinner = { id, amount };
      }
    });
    
    losers.forEach(([id, amount]) => {
      if (amount < biggestLoser.amount) {
        biggestLoser = { id, amount };
      }
    });
    
    return {
      winnerCount: winners.length,
      loserCount: losers.length,
      biggestWinner: biggestWinner.id ? {
        id: biggestWinner.id,
        name: getPlayerName(biggestWinner.id),
        amount: biggestWinner.amount
      } : null,
      biggestLoser: biggestLoser.id ? {
        id: biggestLoser.id,
        name: getPlayerName(biggestLoser.id),
        amount: biggestLoser.amount
      } : null
    };
  };

  const handleShareSession = async (session) => {
    navigation.navigate('SessionShare', { session });
  };
  
  const handleDeleteSession = (sessionId) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const updatedHistory = history.filter(session => session.id !== sessionId);
            dispatch(setHistory(updatedHistory));
          }
        }
      ]
    );
  };
  
  const filterSessions = () => {
    if (filterType === 'all' || !history.length) return history;
    
    const now = new Date();
    let startDate = new Date();
    
    switch (filterType) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return history.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate;
    });
  };
  
  const filteredSessions = filterSessions();
  
  const renderFilterButton = (type, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterType === type && styles.activeFilterButton
      ]}
      onPress={() => setFilterType(type)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filterType === type && styles.activeFilterText
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSessionItem = ({ item, index }) => {
    const stats = getSessionStats(item);
    const isFirst = index === 0;
    
    return (
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.sessionCard,
            isFirst && styles.firstSessionCard
          ]}
          onPress={() => {
            setSelectedSession(item);
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.sessionHeader}>
            <View style={styles.dateContainer}>
              <MaterialIcons name="event" size={18} color="#7F8C8D" />
              <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => {
                Alert.alert(
                  'Session Options',
                  'Choose an action',
                  [
                    { 
                      text: 'Share', 
                      onPress: () => navigation.navigate('SessionShare', { session: item }),
                      style: 'default' 
                    },
                    { 
                      text: 'Delete', 
                      onPress: () => handleDeleteSession(item.id),
                      style: 'destructive' 
                    },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <MaterialIcons name="more-vert" size={24} color="#7F8C8D" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsBar}>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{Object.keys(item.balances).length}</Text>
              <Text style={styles.statsLabel}>Players</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{stats.winnerCount}</Text>
              <Text style={styles.statsLabel}>Winners</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>{stats.loserCount}</Text>
              <Text style={styles.statsLabel}>Losers</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsNumber}>${getTotalTransactionAmount(item.settlements).toFixed(0)}</Text>
              <Text style={styles.statsLabel}>Settled</Text>
            </View>
          </View>
          
          {(stats.biggestWinner || stats.biggestLoser) && (
            <View style={styles.highlightsContainer}>
              {stats.biggestWinner && (
                <View style={styles.playerHighlight}>
                  <View 
                    style={[
                      styles.avatar, 
                      { backgroundColor: getPlayerAvatar(stats.biggestWinner.id) }
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {getInitials(stats.biggestWinner.name)}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerInfoLabel}>Top Winner</Text>
                    <Text style={styles.playerName}>{stats.biggestWinner.name}</Text>
                    <Text style={styles.winnings}>+${stats.biggestWinner.amount.toFixed(2)}</Text>
                  </View>
                </View>
              )}
              
              {stats.biggestLoser && (
                <View style={styles.playerHighlight}>
                  <View 
                    style={[
                      styles.avatar, 
                      { backgroundColor: getPlayerAvatar(stats.biggestLoser.id) }
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {getInitials(stats.biggestLoser.name)}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerInfoLabel}>Biggest Loss</Text>
                    <Text style={styles.playerName}>{stats.biggestLoser.name}</Text>
                    <Text style={styles.losses}>${stats.biggestLoser.amount.toFixed(2)}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
          
          <View style={styles.settlementPreview}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Settlements</Text>
              <Text style={styles.settlementCount}>
                {item.settlements.length > 0 
                  ? `${item.settlements.length} transaction${item.settlements.length > 1 ? 's' : ''}` 
                  : 'No settlements needed'}
              </Text>
            </View>
            
            {item.settlements.length > 0 ? (
              <View style={styles.transactionsPreview}>
                {item.settlements.slice(0, 2).map((settlement, idx) => (
                  <View key={idx} style={styles.transactionItem}>
                    <View style={styles.transactionParties}>
                      <View style={styles.partyContainer}>
                        <View 
                          style={[
                            styles.miniAvatar, 
                            { backgroundColor: getPlayerAvatar(settlement.from) }
                          ]}
                        >
                          <Text style={styles.miniAvatarText}>
                            {getInitials(getPlayerName(settlement.from))}
                          </Text>
                        </View>
                        <Text style={styles.partyName} numberOfLines={1}>
                          {getPlayerName(settlement.from)}
                        </Text>
                      </View>
                      
                      <View style={styles.arrowContainer}>
                        <MaterialIcons name="arrow-forward" size={18} color="#7F8C8D" />
                      </View>
                      
                      <View style={styles.partyContainer}>
                        <View 
                          style={[
                            styles.miniAvatar, 
                            { backgroundColor: getPlayerAvatar(settlement.to) }
                          ]}
                        >
                          <Text style={styles.miniAvatarText}>
                            {getInitials(getPlayerName(settlement.to))}
                          </Text>
                        </View>
                        <Text style={styles.partyName} numberOfLines={1}>
                          {getPlayerName(settlement.to)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.transactionAmount}>
                      ${settlement.amount.toFixed(2)}
                    </Text>
                  </View>
                ))}
                
                {item.settlements.length > 2 && (
                  <TouchableOpacity
                    style={styles.moreTransactionsButton}
                    onPress={() => {
                      setSelectedSession(item);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.moreTransactionsText}>
                      View all {item.settlements.length} transactions
                    </Text>
                    <MaterialIcons name="chevron-right" size={18} color="#3498DB" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.noSettlementsContainer}>
                <Text style={styles.noSettlementsText}>
                  All even! No money needed to change hands.
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
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
          <Text style={styles.headerTitle}>Session History</Text>
        </View>
      </LinearGradient>
      
      {/* Filter buttons */}
      {history.length > 0 && (
        <View style={styles.filterContainer}>
          {renderFilterButton('all', 'All Time')}
          {renderFilterButton('week', 'Last Week')}
          {renderFilterButton('month', 'Last Month')}
          {renderFilterButton('year', 'Last Year')}
        </View>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
          <Text style={styles.loadingText}>Loading session history...</Text>
        </View>
      ) : (
        <FlatList
          data={[...filteredSessions].reverse()} // Show newest first
          renderItem={renderSessionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="history" size={50} color="#BDC3C7" />
              <Text style={styles.emptyText}>No session history yet</Text>
              <Text style={styles.emptySubText}>
                Session details will appear here after you complete your first poker session
              </Text>
              <TouchableOpacity
                style={styles.startSessionButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.startSessionText}>Start a New Session</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      {/* Session Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={24} color="#7F8C8D" />
              </TouchableOpacity>
            </View>
            
            {selectedSession && (
              <>
                <Text style={styles.modalDate}>
                  {formatDate(selectedSession.date)}
                </Text>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Player Balances</Text>
                  <FlatList
                    data={Object.entries(selectedSession.balances)
                      .map(([id, balance]) => [id, getNumericBalance(balance)])
                      .sort(([_, a], [__, b]) => b - a)} // Sort by balance (highest first)
                    renderItem={({ item }) => {
                      const [playerId, balance] = item;
                      return (
                        <View style={styles.balanceRow}>
                          <View style={styles.playerRow}>
                            <View 
                              style={[
                                styles.miniAvatar, 
                                { backgroundColor: getPlayerAvatar(playerId) }
                              ]}
                            >
                              <Text style={styles.miniAvatarText}>
                                {getInitials(getPlayerName(playerId))}
                              </Text>
                            </View>
                            <Text style={styles.modalPlayerName}>{getPlayerName(playerId)}</Text>
                          </View>
                          <Text 
                            style={[
                              styles.modalBalance,
                              balance > 0 ? styles.positiveBalance : balance < 0 ? styles.negativeBalance : styles.neutralBalance
                            ]}
                          >
                            {balance > 0 ? '+' : balance < 0 ? '' : ''}${balance.toFixed(2)}
                          </Text>
                        </View>
                      );
                    }}
                    keyExtractor={([playerId]) => playerId}
                  />
                </View>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Settlements</Text>
                  {selectedSession.settlements.length > 0 ? (
                    <FlatList
                      data={selectedSession.settlements}
                      renderItem={({ item, index }) => (
                        <View style={styles.settlementRow}>
                          <View style={styles.settlementNumber}>
                            <Text style={styles.settlementNumberText}>{index + 1}</Text>
                          </View>
                          <View style={styles.settlementDetails}>
                            <View style={styles.transactionParties}>
                              <View style={styles.partyContainer}>
                                <View 
                                  style={[
                                    styles.miniAvatar, 
                                    { backgroundColor: getPlayerAvatar(item.from) }
                                  ]}
                                >
                                  <Text style={styles.miniAvatarText}>
                                    {getInitials(getPlayerName(item.from))}
                                  </Text>
                                </View>
                                <Text style={styles.partyName} numberOfLines={1}>
                                  {getPlayerName(item.from)}
                                </Text>
                              </View>
                              
                              <View style={styles.arrowContainer}>
                                <MaterialIcons name="arrow-forward" size={18} color="#7F8C8D" />
                              </View>
                              
                              <View style={styles.partyContainer}>
                                <View 
                                  style={[
                                    styles.miniAvatar, 
                                    { backgroundColor: getPlayerAvatar(item.to) }
                                  ]}
                                >
                                  <Text style={styles.miniAvatarText}>
                                    {getInitials(getPlayerName(item.to))}
                                  </Text>
                                </View>
                                <Text style={styles.partyName} numberOfLines={1}>
                                  {getPlayerName(item.to)}
                                </Text>
                              </View>
                            </View>
                            
                            <Text style={styles.modalAmount}>
                              ${item.amount.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      )}
                      keyExtractor={(_, index) => index.toString()}
                    />
                  ) : (
                    <View style={styles.noSettlementsModalContainer}>
                      <Text style={styles.noSettlementsModalText}>
                        No settlements needed for this session
                      </Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('SessionShare', { session: selectedSession });
                  }}
                >
                  <MaterialIcons name="share" size={20} color="white" />
                  <Text style={styles.shareButtonText}>Share Session Details</Text>
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
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
    borderRadius: 15,
    backgroundColor: '#F0F4F8',
  },
  activeFilterButton: {
    backgroundColor: '#E1F0FF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  activeFilterText: {
    color: '#3498DB',
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
    paddingBottom: 30,
  },
  animatedContainer: {
    marginBottom: 20,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstSessionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
  },
  moreButton: {
    padding: 5,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  statsItem: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statsLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  highlightsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  playerHighlight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
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
  playerInfo: {
    flex: 1,
  },
  playerInfoLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 2,
  },
  winnings: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ECC71',
    marginTop: 2,
  },
  losses: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 2,
  },
  settlementPreview: {
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    paddingTop: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  settlementCount: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  transactionsPreview: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  transactionParties: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  miniAvatarText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  partyName: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  arrowContainer: {
    paddingHorizontal: 5,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 10,
  },
  moreTransactionsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    marginTop: 8,
  },
  moreTransactionsText: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '600',
    marginRight: 5,
  },
  noSettlementsContainer: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  noSettlementsText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 50,
  },
emptyText: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#7F8C8D',
  marginTop: 15,
},
emptySubText: {
  fontSize: 14,
  color: '#95A5A6',
  textAlign: 'center',
  marginTop: 10,
  marginBottom: 30,
},
startSessionButton: {
  backgroundColor: '#3498DB',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 8,
},
startSessionText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
},
loadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},
loadingText: {
  marginTop: 15,
  fontSize: 16,
  color: '#7F8C8D',
},
// Modal styles
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'flex-end',
},
modalContent: {
  backgroundColor: 'white',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  maxHeight: '80%',
},
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#EAEAEA',
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#2C3E50',
},
closeButton: {
  padding: 5,
},
modalDate: {
  fontSize: 16,
  color: '#7F8C8D',
  textAlign: 'center',
  marginTop: 5,
  marginBottom: 15,
},
modalSection: {
  padding: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#EAEAEA',
},
modalSectionTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#2C3E50',
  marginBottom: 15,
},
balanceRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 8,
  borderBottomWidth: 1,
  borderBottomColor: '#F0F4F8',
},
playerRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
modalPlayerName: {
  fontSize: 16,
  color: '#2C3E50',
},
modalBalance: {
  fontSize: 16,
  fontWeight: 'bold',
},
positiveBalance: {
  color: '#2ECC71',
},
negativeBalance: {
  color: '#E74C3C',
},
neutralBalance: {
  color: '#7F8C8D',
},
settlementRow: {
  flexDirection: 'row',
  marginBottom: 15,
},
settlementNumber: {
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: '#3498DB',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
},
settlementNumberText: {
  color: 'white',
  fontSize: 12,
  fontWeight: 'bold',
},
settlementDetails: {
  flex: 1,
  backgroundColor: '#F9F9F9',
  borderRadius: 8,
  padding: 10,
},
modalAmount: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#2C3E50',
  textAlign: 'right',
  marginTop: 8,
},
noSettlementsModalContainer: {
  padding: 20,
  alignItems: 'center',
  backgroundColor: '#F9F9F9',
  borderRadius: 8,
},
noSettlementsModalText: {
  fontSize: 16,
  color: '#7F8C8D',
  fontStyle: 'italic',
  textAlign: 'center',
},
shareButton: {
  flexDirection: 'row',
  backgroundColor: '#3498DB',
  marginHorizontal: 20,
  marginVertical: 20,
  padding: 15,
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
},
shareButtonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
  marginLeft: 10,
}
});

export default SessionHistoryScreen;