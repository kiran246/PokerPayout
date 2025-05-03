import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import analyticsUtils from '../utils/analyticsUtils';

// Import SVG charting components
import { LineChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const PlayerAnalyticsScreen = ({ route, navigation }) => {
  const { player } = route.params;
  const { players } = useSelector(state => state.players);
  const { history } = useSelector(state => state.settlements);
  
  const [playerStats, setPlayerStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Calculate analytics when screen loads or history changes
  useEffect(() => {
    const calculateAnalytics = async () => {
      setIsLoading(true);
      
      try {
        // Calculate player stats
        const stats = analyticsUtils.calculatePlayerStats(player.id, history);
        setPlayerStats(stats);
        
        // Get monthly performance data
        const monthly = analyticsUtils.getMonthlyPerformance(player.id, history);
        setMonthlyData(monthly);
        
        // Get performance over time data for charts
        const performance = analyticsUtils.getPlayerPerformanceData(player.id, history);
        setPerformanceData(performance);
      } catch (error) {
        console.error('Error calculating analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    calculateAnalytics();
  }, [player.id, history]);
  
  // Format currency with sign
  const formatCurrency = (value, showSign = true) => {
    if (value === null || value === undefined) return '$0.00';
    
    const numValue = parseFloat(value);
    const isPositive = numValue > 0;
    const sign = isPositive && showSign ? '+' : '';
    
    return `${sign}$${Math.abs(numValue).toFixed(2)}`;
  };
  
  // Get color based on value
  const getValueColor = (value) => {
    if (value > 0) return '#2ECC71';
    if (value < 0) return '#E74C3C';
    return '#7F8C8D';
  };
  
  // Render overview tab
  const renderOverviewTab = () => {
    if (!playerStats) return null;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.statsGrid}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Total Sessions</Text>
            <Text style={styles.statsValue}>{playerStats.totalSessions}</Text>
          </View>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Win Rate</Text>
            <Text style={[styles.statsValue, { color: '#3498DB' }]}>
              {playerStats.winRate.toFixed(0)}%
            </Text>
          </View>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Net Winnings</Text>
            <Text style={[styles.statsValue, { color: getValueColor(playerStats.netWinnings) }]}>
              {formatCurrency(playerStats.netWinnings)}
            </Text>
          </View>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Win/Loss</Text>
            <Text style={styles.statsValue}>
              {playerStats.winCount}/{playerStats.lossCount}
            </Text>
          </View>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Biggest Win</Text>
            <Text style={[styles.statsValue, { color: '#2ECC71' }]}>
              {formatCurrency(playerStats.biggestWin)}
            </Text>
          </View>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Biggest Loss</Text>
            <Text style={[styles.statsValue, { color: '#E74C3C' }]}>
              {formatCurrency(playerStats.biggestLoss)}
            </Text>
          </View>
        </View>
        
        {playerStats.totalSessions > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Status</Text>
            </View>
            
            <View style={styles.currentStatusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Current Streak:</Text>
                <Text 
                  style={[
                    styles.statusValue, 
                    { color: playerStats.currentStreak > 0 ? '#2ECC71' : '#E74C3C' }
                  ]}
                >
                  {Math.abs(playerStats.currentStreak)} {playerStats.currentStreak !== 1 && playerStats.currentStreak !== -1 ? 
                    (playerStats.currentStreak > 0 ? 'wins' : 'losses') : 
                    (playerStats.currentStreak > 0 ? 'win' : 'loss')}
                </Text>
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Best Win Streak:</Text>
                <Text style={[styles.statusValue, { color: '#2ECC71' }]}>
                  {playerStats.winStreak} {playerStats.winStreak === 1 ? 'win' : 'wins'}
                </Text>
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Session:</Text>
                <Text 
                  style={[
                    styles.statusValue, 
                    { color: getValueColor(playerStats.lastSessionBalance) }
                  ]}
                >
                  {formatCurrency(playerStats.lastSessionBalance)}
                </Text>
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Session Date:</Text>
                <Text style={styles.statusValue}>
                  {playerStats.lastSessionDate ? playerStats.lastSessionDate.toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>
            
            {/* Performance Over Time Chart */}
            {performanceData.length > 1 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Performance Over Time</Text>
                </View>
                
                <View style={styles.chartContainer}>
                  <LineChart
                    data={{
                      labels: performanceData.map(data => 
                        new Date(data.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      ).filter((_, i, arr) => i === 0 || i === Math.floor(arr.length / 2) || i === arr.length - 1),
                      datasets: [{
                        data: performanceData.map(data => data.cumulativeBalance)
                      }]
                    }}
                    width={width - 40}
                    height={220}
                    yAxisLabel="$"
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                      style: {
                        borderRadius: 16
                      },
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: '#3498db'
                      }
                    }}
                    bezier
                    style={styles.chart}
                  />
                  <Text style={styles.chartCaption}>Net Winnings ($) Over Time</Text>
                </View>
              </>
            )}
          </>
        )}
      </View>
    );
  };
  
  // Render history tab
  const renderHistoryTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Session History</Text>
        </View>
        
        {monthlyData.length > 0 ? (
          <FlatList
            data={monthlyData}
            keyExtractor={(item) => `${item.year}-${item.month}`}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.monthlyCard}>
                <View style={styles.monthlyHeader}>
                  <Text style={styles.monthlyDate}>{item.monthName} {item.year}</Text>
                  <Text 
                    style={[
                      styles.monthlyWinnings, 
                      { color: getValueColor(item.netWinnings) }
                    ]}
                  >
                    {formatCurrency(item.netWinnings)}
                  </Text>
                </View>
                
                <View style={styles.monthlyStats}>
                  <View style={styles.monthlyStat}>
                    <Text style={styles.monthlyStatLabel}>Sessions</Text>
                    <Text style={styles.monthlyStatValue}>{item.sessions}</Text>
                  </View>
                  
                  <View style={styles.monthlyStat}>
                    <Text style={styles.monthlyStatLabel}>Wins</Text>
                    <Text style={[styles.monthlyStatValue, { color: '#2ECC71' }]}>{item.wins}</Text>
                  </View>
                  
                  <View style={styles.monthlyStat}>
                    <Text style={styles.monthlyStatLabel}>Losses</Text>
                    <Text style={[styles.monthlyStatValue, { color: '#E74C3C' }]}>{item.losses}</Text>
                  </View>
                  
                  <View style={styles.monthlyStat}>
                    <Text style={styles.monthlyStatLabel}>Win Rate</Text>
                    <Text style={styles.monthlyStatValue}>
                      {item.sessions > 0 ? Math.round((item.wins / item.sessions) * 100) : 0}%
                    </Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No session history available</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No session history available</Text>
          </View>
        )}
        
        {monthlyData.length > 2 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Monthly Performance</Text>
            </View>
            
            <View style={styles.chartContainer}>
              <BarChart
                data={{
                  labels: monthlyData.map(data => data.monthName),
                  datasets: [{
                    data: monthlyData.map(data => data.netWinnings)
                  }]
                }}
                width={width - 40}
                height={220}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  barPercentage: 0.7,
                }}
                style={styles.chart}
                fromZero
              />
              <Text style={styles.chartCaption}>Monthly Net Winnings ($)</Text>
            </View>
          </>
        )}
      </View>
    );
  };
  
  // Render rankings tab
  const renderRankingsTab = () => {
    // Get player rankings
    const rankings = analyticsUtils.getPlayerRankings(players, history);
    
    // Find this player's rank
    const playerRank = rankings.findIndex(p => p.id === player.id) + 1;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>Rank: #{playerRank}</Text>
          <Text style={styles.rankSubtext}>of {players.length} players</Text>
        </View>
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top 5 Players (by Net Winnings)</Text>
        </View>
        
        {rankings.slice(0, 5).map((rankedPlayer, index) => (
          <View 
            key={rankedPlayer.id}
            style={[
              styles.rankingRow,
              rankedPlayer.id === player.id && styles.currentPlayerRanking
            ]}
          >
            <View style={styles.rankingNumber}>
              <Text style={styles.rankingNumberText}>{index + 1}</Text>
            </View>
            
            <View style={styles.rankingInfo}>
              <Text style={styles.rankingName}>{rankedPlayer.name}</Text>
              <View style={styles.rankingStats}>
                <Text style={styles.rankingStat}>
                  Sessions: {rankedPlayer.stats.totalSessions}
                </Text>
                <Text style={styles.rankingStat}>
                  Win Rate: {rankedPlayer.stats.winRate.toFixed(0)}%
                </Text>
              </View>
            </View>
            
            <Text 
              style={[
                styles.rankingWinnings, 
                { color: getValueColor(rankedPlayer.stats.netWinnings) }
              ]}
            >
              {formatCurrency(rankedPlayer.stats.netWinnings)}
            </Text>
          </View>
        ))}
        
        {/* If player not in top 5, show their ranking separately */}
        {playerRank > 5 && (
          <>
            <View style={styles.rankingSeparator}>
              <Text style={styles.rankingSeparatorText}>•••</Text>
            </View>
            
            {rankings.filter(p => p.id === player.id).map((rankedPlayer, index) => (
              <View 
                key={rankedPlayer.id}
                style={[styles.rankingRow, styles.currentPlayerRanking]}
              >
                <View style={styles.rankingNumber}>
                  <Text style={styles.rankingNumberText}>{playerRank}</Text>
                </View>
                
                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingName}>{rankedPlayer.name}</Text>
                  <View style={styles.rankingStats}>
                    <Text style={styles.rankingStat}>
                      Sessions: {rankedPlayer.stats.totalSessions}
                    </Text>
                    <Text style={styles.rankingStat}>
                      Win Rate: {rankedPlayer.stats.winRate.toFixed(0)}%
                    </Text>
                  </View>
                </View>
                
                <Text 
                  style={[
                    styles.rankingWinnings, 
                    { color: getValueColor(rankedPlayer.stats.netWinnings) }
                  ]}
                >
                  {formatCurrency(rankedPlayer.stats.netWinnings)}
                </Text>
              </View>
            ))}
          </>
        )}
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Head-to-Head Stats</Text>
        </View>
        
        {players.filter(p => p.id !== player.id).length > 0 ? (
          <FlatList
            data={players.filter(p => p.id !== player.id)}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item: otherPlayer }) => {
              const h2hStats = analyticsUtils.getHeadToHeadStats(player.id, otherPlayer.id, history);
              
              // Skip if no shared sessions
              if (h2hStats.sharedSessions === 0) return null;
              
              return (
                <View style={styles.h2hCard}>
                  <View style={styles.h2hHeader}>
                    <Text style={styles.h2hName}>{otherPlayer.name}</Text>
                    <Text style={styles.h2hSessions}>
                      {h2hStats.sharedSessions} shared {h2hStats.sharedSessions === 1 ? 'session' : 'sessions'}
                    </Text>
                  </View>
                  
                  <View style={styles.h2hStats}>
                    <View style={[styles.h2hStat, { flex: h2hStats.player1Wins || 0.1 }]}>
                      <Text style={styles.h2hStatValue}>{h2hStats.player1Wins}</Text>
                      <Text style={[styles.h2hStatLabel, { color: '#2ECC71' }]}>
                        {h2hStats.player1Wins === 1 ? 'Win' : 'Wins'}
                      </Text>
                    </View>
                    
                    <View style={[styles.h2hStat, { flex: h2hStats.draws || 0.1 }]}>
                      <Text style={styles.h2hStatValue}>{h2hStats.draws}</Text>
                      <Text style={[styles.h2hStatLabel, { color: '#7F8C8D' }]}>
                        {h2hStats.draws === 1 ? 'Draw' : 'Draws'}
                      </Text>
                    </View>
                    
                    <View style={[styles.h2hStat, { flex: h2hStats.player2Wins || 0.1 }]}>
                      <Text style={styles.h2hStatValue}>{h2hStats.player2Wins}</Text>
                      <Text style={[styles.h2hStatLabel, { color: '#E74C3C' }]}>
                        {h2hStats.player2Wins === 1 ? 'Loss' : 'Losses'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.h2hBar}>
                    <View 
                      style={[
                        styles.h2hBarWins, 
                        { flex: h2hStats.player1Wins || 0.1 }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.h2hBarDraws, 
                        { flex: h2hStats.draws || 0.1 }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.h2hBarLosses, 
                        { flex: h2hStats.player2Wins || 0.1 }
                      ]} 
                    />
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No head-to-head data available</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No other players to compare with</Text>
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
          <Text style={styles.headerTitle}>{player.name}'s Stats</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>
      
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.activeTabButton]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'rankings' && styles.activeTabButton]}
          onPress={() => setActiveTab('rankings')}
        >
          <Text style={[styles.tabText, activeTab === 'rankings' && styles.activeTabText]}>
            Rankings
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498DB" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'rankings' && renderRankingsTab()}
        </ScrollView>
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
  headerRight: {
    width: 34, // Same as back button for balance
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498DB',
  },
  tabText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  activeTabText: {
    color: '#3498DB',
    fontWeight: '600',
  },
  tabContent: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    width: '48%',
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
  statsLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  currentStatusCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#2C3E50',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  },
  chartCaption: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginTop: 5,
  },
  monthlyCard: {
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
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  monthlyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  monthlyWinnings: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthlyStat: {
    alignItems: 'center',
  },
  monthlyStatLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  monthlyStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  rankBadge: {
    backgroundColor: '#3498DB',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  rankSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  rankingRow: {
    flexDirection: 'row',
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
  currentPlayerRanking: {
    backgroundColor: '#E1F0FF',
    borderWidth: 1,
    borderColor: '#3498DB',
  },
  rankingNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankingNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  rankingStats: {
    flexDirection: 'row',
  },
  rankingStat: {
    fontSize: 12,
    color: '#7F8C8D',
    marginRight: 10,
  },
  rankingWinnings: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankingSeparator: {
    alignItems: 'center',
    marginVertical: 5,
  },
  rankingSeparatorText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  h2hCard: {
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
  h2hHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  h2hName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  h2hSessions: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  h2hStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  h2hStat: {
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  h2hStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  h2hStatLabel: {
    fontSize: 12,
  },
  h2hBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  h2hBarWins: {
    backgroundColor: '#2ECC71',
  },
  h2hBarDraws: {
    backgroundColor: '#95A5A6',
  },
  h2hBarLosses: {
    backgroundColor: '#E74C3C',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7F8C8D',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
});

export default PlayerAnalyticsScreen;