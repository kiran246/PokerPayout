import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { startNewSession } from '../store/settlementSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { players } = useSelector(state => state.players);
  const { sessionId } = useSelector(state => state.settlements);
  
  // State for modals
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showPreSettleModal, setShowPreSettleModal] = useState(false);
  const [gameName, setGameName] = useState('');
  const [defaultBuyIn, setDefaultBuyIn] = useState('');
  
  // Handle starting a new game
  const handleStartNewGame = () => {
    if (!gameName.trim()) {
      Alert.alert('Error', 'Please enter a game name');
      return;
    }
    
    // Convert defaultBuyIn to a number, defaulting to 0 if invalid
    const buyIn = defaultBuyIn ? parseFloat(defaultBuyIn) : 0;
    
    dispatch(startNewSession());
    
    // Navigate to Players screen first to set up players for this game
    navigation.navigate('Players', { 
      nextScreen: 'GameManagementScreen',
      gameData: { name: gameName, buyIn: buyIn }
    });
    
    setShowNewGameModal(false);
    setGameName('');
    setDefaultBuyIn('');
  };
  
  // Handle pre-settlement flow
  const handlePreSettle = () => {
    // Navigate directly to GameSessionsScreen
    navigation.navigate('GameSessionsScreen');
    setShowPreSettleModal(false);
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#2C3E50', '#4CA1AF']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.appTitle}>Poker Settlement App Kiran</Text>
          <Text style={styles.appSubtitle}>Track and settle poker debts easily</Text>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.mainOptionsContainer}>
            {/* MAIN OPTION BUTTONS */}
            <TouchableOpacity 
              style={[styles.mainButton, styles.recordButton]}
              onPress={() => setShowNewGameModal(true)}
            >
              <View style={styles.buttonIconContainer}>
                <FontAwesome5 name="play-circle" size={28} color="white" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Record a New Game</Text>
                <Text style={styles.buttonDescription}>
                  Start tracking a new poker game in real-time
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.mainButton, styles.settleButton]}
              onPress={() => setShowPreSettleModal(true)}
            >
              <View style={styles.buttonIconContainer}>
                <FontAwesome5 name="money-bill-wave" size={28} color="white" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Settle Amounts</Text>
                <Text style={styles.buttonDescription}>
                  Enter final balances and calculate optimal transfers
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.mainButton, styles.manageButton]}
              onPress={() => navigation.navigate('GameManagementScreen')}
            >
              <View style={styles.buttonIconContainer}>
                <FontAwesome5 name="gamepad" size={28} color="white" />
              </View>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonTitle}>Manage Games</Text>
                <Text style={styles.buttonDescription}>
                  View and manage all recorded poker games
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.secondaryOptionsContainer}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('History')}
            >
              <FontAwesome5 name="history" size={20} color="#3498DB" />
              <Text style={styles.secondaryButtonText}>Session History</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
      
      {/* New Game Modal */}
      <Modal
        visible={showNewGameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewGameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start New Game</Text>
            
            <Text style={styles.inputLabel}>Game Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter game name"
              value={gameName}
              onChangeText={setGameName}
              autoFocus
            />
            
            <Text style={styles.inputLabel}>Default Buy-in Amount</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter amount (optional)"
              keyboardType="decimal-pad"
              value={defaultBuyIn}
              onChangeText={setDefaultBuyIn}
            />
            
            <Text style={styles.modalNote}>
              Next, you'll be able to add players for this game.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewGameModal(false);
                  setGameName('');
                  setDefaultBuyIn('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.startButton,
                  !gameName.trim() && styles.disabledButton
                ]}
                onPress={handleStartNewGame}
                disabled={!gameName.trim()}
              >
                <Text style={styles.startButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Pre-Settlement Modal */}
      <Modal
        visible={showPreSettleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPreSettleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settle Amounts</Text>
            
            <Text style={styles.modalDescription}>
              First, you'll need to confirm which players participated in the game. 
              You can add new players or select existing ones.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPreSettleModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.startButton]}
                onPress={handlePreSettle}
              >
                <Text style={styles.startButtonText}>Continue</Text>
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
  gradient: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  appSubtitle: {
    fontSize: 16, 
    color: '#BDC3C7',
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  mainOptionsContainer: {
    marginBottom: 30,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  recordButton: {
    backgroundColor: '#2ECC71', // Green
  },
  settleButton: {
    backgroundColor: '#3498DB', // Blue
  },
  manageButton: {
    backgroundColor: '#9B59B6', // Purple
  },
  buttonIconContainer: {
    marginRight: 15,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  buttonDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalNote: {
    fontSize: 14,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F9F9F9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
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
  startButton: {
    backgroundColor: '#2ECC71',
    marginLeft: 10,
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
  },
});

export default HomeScreen;