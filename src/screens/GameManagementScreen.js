import React, { useState } from 'react';
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
  Modal
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { startNewGame, endGame } from '../store/settlementSlice';

const GameManagementScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { players } = useSelector(state => state.players);
  const { sessionId, games } = useSelector(state => state.settlements);
  
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [gameName, setGameName] = useState('');
  const [defaultBuyIn, setDefaultBuyIn] = useState('');
  
  // Calculate stats for a game
  const getGameStats = (game) => {
    const activePlayerCount = game.players ? game.players.length : 0;
    const buyInTotal = game.players ? game.players.reduce((sum, player) => sum + (player.initialBuyIn || 0), 0) : 0;
    const isActive = !game.endTime;
    
    return {
      activePlayerCount,
      buyInTotal,
      isActive
    };
  };
  
  // Handle creating a new game
  const handleCreateGame = () => {
    if (!gameName.trim()) {
      Alert.alert('Error', 'Please enter a game name');
      return;
    }
    
    // Convert defaultBuyIn to a number, defaulting to 0 if invalid
    const buyIn = defaultBuyIn ? parseFloat(defaultBuyIn) : 0;
    const numericBuyIn = isNaN(buyIn) ? 0 : buyIn;
    
    dispatch(startNewGame({
      gameName: gameName.trim(),
      buyIn: numericBuyIn
    }));
    
    // Reset form state
    setGameName('');
    setDefaultBuyIn('');
    setShowNewGameModal(false);
  };
  
  // Handle ending a game
  const handleEndGame = (gameId) => {
    Alert.alert(
      'End Game',
      'Are you sure you want to end this game? This will mark it as completed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Game', 
          onPress: () => dispatch(endGame({ gameId }))
        }
      ]
    );
  };
  
  // Render game item
  const renderGameItem = ({ item }) => {
    const stats = getGameStats(item);
    const startDate = new Date(item.startTime);
    const endDate = item.endTime ? new Date(item.endTime) : null;
    
    return (
      <TouchableOpacity
        style={[
          styles.gameItem,
          stats.isActive && styles.activeGameItem
        ]}
        onPress={() => navigation.navigate('GameLedgerScreen', { gameId: item.id })}
      >
        <View style={styles.gameHeader}>
          <View style={styles.gameInfo}>
            <Text style={styles.gameName}>{item.name}</Text>
            <Text style={styles.gameDate}>
              Started: {startDate.toLocaleString()}
            </Text>
            {endDate && (
              <Text style={styles.gameDate}>
                Ended: {endDate.toLocaleString()}
              </Text>
            )}
          </View>
          
          {stats.isActive ? (
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>Active</Text>
            </View>
          ) : (
            <View style={styles.completedTag}>
              <Text style={styles.completedTagText}>Completed</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
  style={styles.gameAction}
  onPress={() => navigation.navigate('GamePlayerManagementScreen', { 
    gameId: item.id,
    gameName: item.name
  })}
>
  <MaterialIcons name="group" size={18} color="#3498DB" />
  <Text style={styles.gameActionText}>Players</Text>
</TouchableOpacity>

// Make sure it's inside the View with gameActions style:
<View style={styles.gameActions}>
  <TouchableOpacity
    style={styles.gameAction}
    onPress={() => navigation.navigate('BuyInScreen', { gameId: item.id })}
  >
    <MaterialIcons name="attach-money" size={18} color="#3498DB" />
    <Text style={styles.gameActionText}>Buy-In</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={styles.gameAction}
    onPress={() => navigation.navigate('GameLedgerScreen', { gameId: item.id })}
  >
    <MaterialIcons name="receipt" size={18} color="#3498DB" />
    <Text style={styles.gameActionText}>Ledger</Text>
  </TouchableOpacity>
  
  {/* New button to manage players */}
  <TouchableOpacity
    style={styles.gameAction}
    onPress={() => navigation.navigate('GamePlayerManagementScreen', { 
      gameId: item.id,
      gameName: item.name
    })}
  >
    <MaterialIcons name="group" size={18} color="#3498DB" />
    <Text style={styles.gameActionText}>Players</Text>
  </TouchableOpacity>
  
  {stats.isActive && (
    <TouchableOpacity
      style={styles.gameAction}
      onPress={() => handleEndGame(item.id)}
    >
      <MaterialIcons name="flag" size={18} color="#3498DB" />
      <Text style={styles.gameActionText}>End Game</Text>
    </TouchableOpacity>
  )}
</View>
        <View style={styles.gameStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Players</Text>
            <Text style={styles.statValue}>{stats.activePlayerCount}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Buy-in</Text>
            <Text style={styles.statValue}>${(item.buyIn || 0).toFixed(2)}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Buy-ins</Text>
            <Text style={styles.statValue}>${stats.buyInTotal.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.gameActions}>
          <TouchableOpacity
            style={styles.gameAction}
            onPress={() => navigation.navigate('BuyInScreen', { gameId: item.id })}
          >
            <MaterialIcons name="attach-money" size={18} color="#3498DB" />
            <Text style={styles.gameActionText}>Buy-In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.gameAction}
            onPress={() => navigation.navigate('GameLedgerScreen', { gameId: item.id })}
          >
            <MaterialIcons name="receipt" size={18} color="#3498DB" />
            <Text style={styles.gameActionText}>Ledger</Text>
          </TouchableOpacity>
          
          {stats.isActive && (
            <TouchableOpacity
              style={styles.gameAction}
              onPress={() => handleEndGame(item.id)}
            >
              <MaterialIcons name="flag" size={18} color="#3498DB" />
              <Text style={styles.gameActionText}>End Game</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Game Management</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowNewGameModal(true)}
          >
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      <View style={styles.container}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>Current Session</Text>
          <Text style={styles.sessionId}>ID: {sessionId}</Text>
        </View>
        
        {games && games.length > 0 ? (
          <FlatList
            data={[...games].sort((a, b) => {
              // Active games first, then by date (newest first)
              if (a.endTime && !b.endTime) return 1;
              if (!a.endTime && b.endTime) return -1;
              return new Date(b.startTime) - new Date(a.startTime);
            })}
            renderItem={renderGameItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.gamesList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="dice" size={50} color="#BDC3C7" />
            <Text style={styles.emptyText}>No games started yet</Text>
            <Text style={styles.emptySubText}>
              Create a game to start tracking buy-ins and transactions
            </Text>
            <TouchableOpacity
              style={styles.createGameButton}
              onPress={() => setShowNewGameModal(true)}
            >
              <Text style={styles.createGameButtonText}>Create First Game</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* New Game Modal */}
      <Modal
        visible={showNewGameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewGameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Game</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Game name"
              value={gameName}
              onChangeText={setGameName}
              autoFocus
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Default buy-in amount (optional)"
              keyboardType="decimal-pad"
              value={defaultBuyIn}
              onChangeText={setDefaultBuyIn}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setGameName('');
                  setDefaultBuyIn('');
                  setShowNewGameModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.createButton,
                  !gameName.trim() && styles.disabledButton
                ]}
                onPress={handleCreateGame}
                disabled={!gameName.trim()}
              >
                <Text style={styles.createButtonText}>Create</Text>
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
  sessionInfo: {
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
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  sessionId: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 5,
  },
  gamesList: {
    paddingBottom: 20,
  },
  gameItem: {
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
  activeGameItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#2ECC71',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  gameDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  activeTag: {
    backgroundColor: '#E1F5E0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  activeTagText: {
    color: '#27AE60',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedTag: {
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  completedTagText: {
    color: '#7F8C8D',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameStats: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  gameActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
  },
  gameAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameActionText: {
    color: '#3498DB',
    marginLeft: 5,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    marginBottom: 20,
  },
  createGameButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createGameButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
  modalInput: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default GameManagementScreen;