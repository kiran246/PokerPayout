import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  RefreshControl
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { startNewSession, resetSession } from '../store/settlementSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import analyticsUtils from '../utils/analyticsUtils';
import BuyInSummary from '../components/BuyInSummary';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { players } = useSelector(state => state.players);
  const { sessionId, balances, history } = useSelector(state => state.settlements);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [recentSessions, setRecentSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Get top player by winnings
  const getTopPlayer = (players, history) => {
    if (players.length === 0 || history.length === 0) return null;
    
    const rankings = analyticsUtils.getPlayerRankings(players, history);
    if (rankings.length > 0) {
      return rankings[0]; // First player is the top player by winnings
    }
    
    return null;
  };

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Simulate refresh by waiting for a bit
    setTimeout(() => {
      // You could load updated data here if needed
      if (history && history.length > 0) {
        setRecentSessions(history.slice(-3).reverse());
      }
      setRefreshing(false);
    }, 1000);
  }, [history]);

  useEffect(() => {
    // Get the 3 most recent sessions for the quick view section
    if (history && history.length > 0) {
      setRecentSessions(history.slice(-3).reverse());
    }
  }, [history]);

  const startSession = () => {
    if (players.length < 2) {
      Alert.alert(
        "Not Enough Players",
        "You need at least 2 players to start a session.",
        [{ text: "OK" }]
      );
      return;
    }
    dispatch(startNewSession());
    navigation.navigate('Settlement');
  };

  const continueSession = () => {
    if (sessionId) {
      navigation.navigate('Settlement');
    } else {
      startSession();
    }
  };

  const checkForExistingSession = () => {
    // Check if there's an active session with balances
    const hasExistingBalances = sessionId && Object.keys(balances).length > 0;
    
    if (hasExistingBalances) {
      Alert.alert(
        "Session in Progress",
        "You have a session in progress. What would you like to do?",
        [
          {
            text: "Continue",
            onPress: () => navigation.navigate('Settlement')
          },
          {
            text: "Start New",
            style: "destructive",
            onPress: () => {
              dispatch(resetSession());
              startSession();
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } else {
      startSession();
    }
  };

  const getPlayerNameById = (id) => {
    const player = players.find(p => p.id === id);
    return player ? player.name : 'Unknown Player';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionSummary = (session) => {
    if (!session.settlements || session.settlements.length === 0) {
      return "No settlements needed";
    }
    
    return `${session.settlements.length} transactions`;
  };

  // Function to safely convert and format balance values
  const formatBalance = (balance) => {
    // Convert any string balances to numbers
    const numBalance = typeof balance === 'string' ? parseFloat(balance) || 0 : balance || 0;
    return numBalance.toFixed(2);
  };

  // Function to check if a balance is positive or negative
  const isPositiveBalance = (balance) => {
    const numBalance = typeof balance === 'string' ? parseFloat(balance) || 0 : balance || 0;
    return numBalance > 0;
  };
  
  // Get player initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get random color
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#2C3E50', '#4CA1AF']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.appTitle}>Poker Settlement</Text>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => setShowInfoModal(true)}
          >
            <MaterialIcons name="info-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3498DB']}
              tintColor={'#3498DB'}
            />
          }
        >
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{players.length}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{history.length}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{sessionId ? 'Active' : 'None'}</Text>
              <Text style={styles.statLabel}>Current</Text>
            </View>
          </View>

          {players.length > 0 && (
            <BuyInSummary navigation={navigation} />
          )}

          <View style={styles.cardContainer}>
            <TouchableOpacity 
              style={[styles.actionCard, styles.primaryCard]}
              onPress={checkForExistingSession}
            >
              <FontAwesome5 name="money-bill-wave" size={24} color="white" />
              <Text style={styles.cardTitle}>
                {sessionId ? 'Continue Session' : 'Start New Session'}
              </Text>
            </TouchableOpacity>

            <View style={styles.rowContainer}>
              <TouchableOpacity 
                style={[styles.actionCard, styles.halfCard, styles.blueCard]}
                onPress={() => navigation.navigate('Players')}
              >
                <FontAwesome5 name="users" size={20} color="white" />
                <Text style={styles.cardTitle}>Manage Players</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionCard, styles.halfCard, styles.purpleCard]}
                onPress={() => navigation.navigate('History')}
              >
                <FontAwesome5 name="history" size={20} color="white" />
                <Text style={styles.cardTitle}>View History</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rowContainer}>
              <TouchableOpacity 
                style={[styles.actionCard, styles.halfCard, styles.greenCard]}
                onPress={() => navigation.navigate('BuyInScreen')}
              >
                <FontAwesome5 name="money-bill-wave" size={20} color="white" />
                <Text style={styles.cardTitle}>Track Buy-ins</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionCard, styles.halfCard, styles.orangeCard]}
                onPress={() => navigation.navigate('GameManagementScreen')}
              >
                <FontAwesome5 name="gamepad" size={20} color="white" />
                <Text style={styles.cardTitle}>Manage Games</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {players.length > 0 && history.length > 0 && (
            <View style={styles.analyticsContainer}>
              <Text style={styles.sectionTitle}>Analytics</Text>
              
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsHeader}>
                  <FontAwesome5 name="chart-line" size={20} color="#9B59B6" />
                  <Text style={styles.analyticsTitle}>Performance Summary</Text>
                </View>
                
                {/* Top player section */}
                {(() => {
                  const topPlayer = getTopPlayer(players, history);
                  if (topPlayer) {
                    const stats = topPlayer.stats;
                    return (
                      <View style={styles.topPlayerContainer}>
                        <View style={styles.topPlayerHeader}>
                          <Text style={styles.topPlayerTitle}>Top Player</Text>
                          <TouchableOpacity
                            onPress={() => navigation.navigate('PlayerAnalytics', { player: topPlayer })}
                          >
                            <Text style={styles.viewDetailsText}>View Details</Text>
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.topPlayerInfo}>
                          <View 
                            style={[
                              styles.topPlayerAvatar, 
                              { backgroundColor: topPlayer.avatarColor || getRandomColor() }
                            ]}
                          >
                            <Text style={styles.topPlayerAvatarText}>
                              {getInitials(topPlayer.name)}
                            </Text>
                          </View>
                          
                          <View style={styles.topPlayerStats}>
                            <Text style={styles.topPlayerName}>{topPlayer.name}</Text>
                            <Text style={styles.topPlayerWinnings}>
                              Net: ${stats.netWinnings.toFixed(2)}
                            </Text>
                            <Text style={styles.topPlayerRecord}>
                              Record: {stats.winCount}W - {stats.lossCount}L ({Math.round(stats.winRate)}%)
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  }
                  return null;
                })()}
                
                {/* Session stats overview */}
                <View style={styles.sessionStatsContainer}>
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatNumber}>{history.length}</Text>
                    <Text style={styles.sessionStatLabel}>Total Sessions</Text>
                  </View>
                  
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatNumber}>
                      {analyticsUtils.getSessionStats(history, players).averagePlayersPerSession.toFixed(1)}
                    </Text>
                    <Text style={styles.sessionStatLabel}>Avg. Players</Text>
                  </View>
                  
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatNumber}>
                      ${analyticsUtils.getSessionStats(history, players).avgSettlementAmount.toFixed(0)}
                    </Text>
                    <Text style={styles.sessionStatLabel}>Avg. Transaction</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.viewAllAnalyticsButton}
                  onPress={() => navigation.navigate('Players')}
                >
                  <Text style={styles.viewAllAnalyticsText}>View Player Analytics</Text>
                  <MaterialIcons name="arrow-forward" size={16} color="#9B59B6" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {recentSessions.length > 0 && (
            <View style={styles.recentContainer}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              
              {recentSessions.map((session, index) => (
                <TouchableOpacity 
                  key={session.id}
                  style={styles.recentSessionCard}
                  onPress={() => navigation.navigate('History')}
                >
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                    <Text style={styles.sessionSummary}>{getSessionSummary(session)}</Text>
                  </View>
                  
                  <View style={styles.playersList}>
                    {Object.entries(session.balances)
                      .map(([playerId, balance]) => {
                        // Convert any string balances to numbers
                        const numBalance = typeof balance === 'string' ? parseFloat(balance) || 0 : balance || 0;
                        return [playerId, numBalance];
                      })
                      .sort((a, b) => b[1] - a[1]) // Sort by balance (highest first)
                      .slice(0, 3) // Show top 3 players
                      .map(([playerId, balance]) => (
                        <View key={playerId} style={styles.playerRow}>
                          <Text style={styles.playerName}>
                            {getPlayerNameById(playerId)}
                          </Text>
                          <Text 
                            style={[
                              styles.playerBalance,
                              balance > 0 ? styles.positiveBalance : styles.negativeBalance
                            ]}
                          >
                            {balance > 0 ? '+' : ''}{formatBalance(balance)}
                          </Text>
                        </View>
                      ))
                    }
                    {Object.keys(session.balances).length > 3 && (
                      <Text style={styles.morePlayersLabel}>
                        + {Object.keys(session.balances).length - 3} more players
                      </Text>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.viewSessionButton}
                    onPress={() => navigation.navigate('SessionShare', { session })}
                  >
                    <MaterialIcons name="share" size={16} color="#3498DB" />
                    <Text style={styles.viewSessionButtonText}>Share Session</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              
              {history.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('History')}
                >
                  <Text style={styles.viewAllText}>View All Sessions</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {/* App Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>About Poker Settlement</Text>
            
            <Text style={styles.modalText}>
              This app helps you track and settle poker debts among friends with minimal transactions.
            </Text>
            
            <Text style={styles.modalSubtitle}>How to use:</Text>
            <Text style={styles.modalListItem}>1. Add your poker players</Text>
            <Text style={styles.modalListItem}>2. Track buy-ins during the game</Text>
            <Text style={styles.modalListItem}>3. Use the ledger to monitor balances</Text>
            <Text style={styles.modalListItem}>4. Get optimal settlement plan at the end</Text>
            
            <Text style={styles.modalSubtitle}>Tips:</Text>
            <Text style={styles.modalListItem}>• Positive values for winners</Text>
            <Text style={styles.modalListItem}>• Negative values for losers</Text>
            <Text style={styles.modalListItem}>• All balances must sum to zero</Text>
            <Text style={styles.modalListItem}>• Create multiple games in a session</Text>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  infoButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  statBox: {
    alignItems: 'center',
    minWidth: width / 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  cardContainer: {
    paddingHorizontal: 20,
  },
  actionCard: {
    backgroundColor: '#3498DB',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryCard: {
    backgroundColor: '#2ECC71',
    paddingVertical: 25,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfCard: {
    flex: 0.48,
    justifyContent: 'center',
  },
  blueCard: {
    backgroundColor: '#3498DB',
  },
  purpleCard: {
    backgroundColor: '#9B59B6',
  },
  greenCard: {
    backgroundColor: '#2ECC71',
  },
  orangeCard: {
    backgroundColor: '#F39C12',
  },
  cardTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 15,
  },
  analyticsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  analyticsCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 10,
  },
  topPlayerContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  topPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topPlayerTitle: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#9B59B6',
  },
  topPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topPlayerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  topPlayerAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  topPlayerStats: {
    flex: 1,
  },
  topPlayerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 3,
  },
  topPlayerWinnings: {
    fontSize: 15,
    color: '#2ECC71',
    fontWeight: '600',
    marginBottom: 3,
  },
  topPlayerRecord: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  sessionStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sessionStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  sessionStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  sessionStatLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 5,
  },
  viewAllAnalyticsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  viewAllAnalyticsText: {
    fontSize: 14,
    color: '#9B59B6',
    fontWeight: '600',
    marginRight: 5,
  },
  recentContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  recentSessionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
  },
  sessionSummary: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  playersList: {
    marginTop: 5,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  playerName: {
    fontSize: 15,
    color: '#2C3E50',
  },
  playerBalance: {
    fontSize: 15,
    fontWeight: '500',
  },
  positiveBalance: {
    color: '#2ECC71',
  },
  negativeBalance: {
    color: '#E74C3C',
  },
  morePlayersLabel: {
    marginTop: 10,
    color: '#7F8C8D',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  viewSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  viewSessionButtonText: {
    color: '#3498DB',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  viewAllButton: {
    padding: 15,
    alignItems: 'center',
  },
  viewAllText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2C3E50',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: '#2C3E50',
  },
  modalListItem: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 8,
    paddingLeft: 10,
  },
  closeButton: {
    backgroundColor: '#3498DB',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;