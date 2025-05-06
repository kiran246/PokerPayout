// src/components/BuyInSummary.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal
} from 'react-native';
import { useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';

const BuyInSummary = ({ navigation }) => {
  const { players } = useSelector(state => state.players);
  const { sessionId, gameLog } = useSelector(state => state.settlements);
  
  // Calculate buy-in statistics
  const getBuyInStats = () => {
    // Filter transactions for buy-ins only
    const buyIns = gameLog.filter(transaction => transaction.type === 'buy-in');
    
    if (buyIns.length === 0) {
      return {
        totalBuyIns: 0,
        totalAmount: 0,
        averageAmount: 0,
        playerCount: 0
      };
    }
    
    const totalAmount = buyIns.reduce((sum, transaction) => sum + transaction.amount, 0);
    const uniquePlayers = new Set(buyIns.map(transaction => transaction.playerId));
    
    return {
      totalBuyIns: buyIns.length,
      totalAmount,
      averageAmount: totalAmount / buyIns.length,
      playerCount: uniquePlayers.size
    };
  };
  
  const stats = getBuyInStats();
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buy-in Summary</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('BuyInScreen')}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <MaterialIcons name="chevron-right" size={16} color="#3498DB" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalBuyIns}</Text>
          <Text style={styles.statLabel}>Total Buy-ins</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${stats.totalAmount.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Amount</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.playerCount}</Text>
          <Text style={styles.statLabel}>Players</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${stats.averageAmount.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Avg. Buy-in</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.addBuyInButton}
        onPress={() => navigation.navigate('BuyInScreen')}
      >
        <MaterialIcons name="add" size={18} color="white" />
        <Text style={styles.addBuyInText}>Record Buy-in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#3498DB',
    fontSize: 14,
    marginRight: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  statItem: {
    width: '50%',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  addBuyInButton: {
    flexDirection: 'row',
    backgroundColor: '#3498DB',
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBuyInText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 5,
  },
});

export default BuyInSummary;