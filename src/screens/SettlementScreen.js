import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Keyboard,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { 
  setPlayerBalance, 
  saveSettlements, 
  completeSession,
  startNewSession,
  resetSession
} from '../store/settlementSlice';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { calculateOptimalSettlements, verifyBalances } from '../utils/settlementCalculator';
import { saveHistory } from '../api/storage';

const { width, height } = Dimensions.get('window');

const SettlementScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { players } = useSelector(state => state.players);
  const { sessionId, balances, settlements, history } = useSelector(state => state.settlements);
  
  const [showSettlements, setShowSettlements] = useState(false);
  const [isAutoComplete, setIsAutoComplete] = useState(false);
  const [suggestedBalances, setSuggestedBalances] = useState({});
  const [showTips, setShowTips] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Reference to scroll view to scroll to active input
  const scrollViewRef = useRef(null);
  
  // Auto-scroll to the editing player
  useEffect(() => {
    if (editingPlayerId && scrollViewRef.current) {
      // Need timeout for the keyboard to fully appear
      setTimeout(() => {
        const playerIndex = players.findIndex(p => p.id === editingPlayerId);
        if (playerIndex !== -1 && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ 
            y: playerIndex * 90, // Approximate height of each player row
            animated: true 
          });
        }
      }, 300);
    }
  }, [editingPlayerId, players]);
  
  // Update history in storage when it changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);
  
  // Calculate total balance whenever balances change
  useEffect(() => {
    const total = Object.values(balances).reduce((sum, balance) => {
      // Convert string balances to numbers, handling empty and '-' cases
      const numBalance = balance === '' || balance === '-' ? 0 : parseFloat(balance) || 0;
      return sum + numBalance;
    }, 0);
    setTotalBalance(total);
  }, [balances]);
  
  // Start a new session if none exists
  useEffect(() => {
    if (!sessionId) {
      dispatch(startNewSession());
    }
  }, [sessionId, dispatch]);
  
  // Listen for keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setEditingPlayerId(null);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Animation for toggling between balances and settlements view
  useEffect(() => {
    if (showSettlements) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        fadeAnim.setValue(1);
        slideAnim.setValue(width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        fadeAnim.setValue(1);
        slideAnim.setValue(-width);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [showSettlements, fadeAnim, slideAnim, width]);
  
  // Animation for the refresh icon when auto-balancing
  useEffect(() => {
    if (isAutoComplete) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isAutoComplete, rotateAnim]);
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handleBalanceChange = (playerId, value) => {
    // Clear auto-complete when manually editing
    if (isAutoComplete) {
      setIsAutoComplete(false);
    }
    
    // Handle negative sign separately
    if (value === '-') {
      dispatch(setPlayerBalance({ playerId, amount: value }));
      return;
    }
    
    // For all other cases, validate input as a number
    const valueStr = String(value);
    // This regex allows decimal points and digits
    const regex = /^-?\d*\.?\d*$/;
    
    if (valueStr === '' || regex.test(valueStr)) {
      // Update the balance
      dispatch(setPlayerBalance({ playerId, amount: value }));
    }
  };

  const calculateSettlements = () => {
    setIsCalculating(true);
    
    // Verify balances sum to zero
    if (Math.abs(totalBalance) > 0.01) {
      Alert.alert(
        'Balances Don\'t Sum to Zero',
        `The sum of all balances is $${totalBalance.toFixed(2)}. Would you like to automatically adjust them?`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => setIsCalculating(false)
          },
          { 
            text: 'Auto-Adjust', 
            onPress: autoAdjustBalances
          }
        ]
      );
      return;
    }
    
    // Convert any string balances to numbers
    const numericBalances = {};
    Object.entries(balances).forEach(([playerId, balance]) => {
      numericBalances[playerId] = (balance === '' || balance === '-') ? 0 : parseFloat(balance) || 0;
    });
    
    const calculatedSettlements = calculateOptimalSettlements(numericBalances);
    dispatch(saveSettlements(calculatedSettlements));
    setShowSettlements(true);
    setIsCalculating(false);
  };

  const autoAdjustBalances = () => {
    setIsAutoComplete(true);
    
    // Get non-zero balances
    const nonZeroBalances = Object.entries(balances)
      .filter(([_, amount]) => {
        const numAmount = amount === '' || amount === '-' ? 0 : parseFloat(amount) || 0;
        return numAmount !== 0;
      });
    
    if (nonZeroBalances.length === 0) {
      Alert.alert(
        'No Balances Entered',
        'Please enter at least one player balance before auto-adjusting.',
        [{ text: 'OK' }]
      );
      setIsAutoComplete(false);
      setIsCalculating(false);
      return;
    }
    
    // Calculate correction amount
    const correction = totalBalance / nonZeroBalances.length;
    
    // Create adjusted balances
    const adjustedBalances = { ...balances };
    
    nonZeroBalances.forEach(([playerId, amount]) => {
      const numAmount = (typeof amount === 'string') ? parseFloat(amount) || 0 : amount || 0;
      adjustedBalances[playerId] = parseFloat((numAmount - correction).toFixed(2));
    });
    
    // Set suggested balances for display
    setSuggestedBalances(adjustedBalances);
    
    // Apply suggestions after a delay to show animation
    setTimeout(() => {
      Object.entries(adjustedBalances).forEach(([playerId, amount]) => {
        dispatch(setPlayerBalance({ playerId, amount }));
      });
      
      setIsAutoComplete(false);
      setIsCalculating(false);
      
      // Calculate settlements with adjusted balances
      const calculatedSettlements = calculateOptimalSettlements(adjustedBalances);
      dispatch(saveSettlements(calculatedSettlements));
      setShowSettlements(true);
    }, 2000);
  };

  const finishSession = () => {
    setConfirming(true);
  };
  
  const confirmFinishSession = () => {
    dispatch(completeSession());
    setConfirming(false);
    navigation.navigate('Home');
  };
  
  const cancelFinishSession = () => {
    setConfirming(false);
  };

  const resetBalances = () => {
    Alert.alert(
      'Reset Balances',
      'Are you sure you want to reset all balances to zero?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: () => {
            players.forEach(player => {
              dispatch(setPlayerBalance({ playerId: player.id, amount: 0 }));
            });
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  // Add the reset session function
  const handleResetSession = () => {
    Alert.alert(
      'Reset Session',
      'Are you sure you want to reset the entire session? All balances and settlements will be lost.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        { 
          text: 'Reset Session', 
          onPress: () => {
            dispatch(resetSession());
            setShowSettlements(false);
            navigation.navigate('Home');
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
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
  
  const formatBalance = (balance) => {
    if (balance === '' || balance === '-') return balance;
    return typeof balance === 'number' ? balance.toFixed(2) : '0.00';
  };

  // Check if a balance is positive or negative for styling
  const getBalanceType = (balance) => {
    if (balance === '' || balance === '0') return 'neutral';
    if (balance === '-') return 'negative';
    
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) return 'neutral';
    if (numBalance > 0) return 'positive';
    if (numBalance < 0) return 'negative';
    return 'neutral';
  };

  const renderPlayerBalanceItem = ({ item, index }) => {
    const balance = balances[item.id] !== undefined ? balances[item.id] : 0;
    const suggestedBalance = suggestedBalances[item.id];
    const isEditing = editingPlayerId === item.id;
    const balanceType = getBalanceType(balance);
    
    return (
      <Animated.View 
        style={[
          styles.balanceItemContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <View 
          style={[
            styles.balanceItem,
            isEditing && styles.balanceItemActive
          ]}
        >
          <View style={styles.playerInfo}>
            <View 
              style={[
                styles.avatar, 
                { backgroundColor: item.avatarColor || getRandomColor() }
              ]}
            >
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>
            <Text style={styles.playerName} numberOfLines={1}>{item.name}</Text>
          </View>
          
          <View style={styles.balanceInputContainer}>
  {/* Add a sign toggle button */}
  <TouchableOpacity
    style={[
      styles.signButton,
      balanceType === 'negative' ? styles.negativeButton : styles.positiveButton
    ]}
    onPress={() => {
      // Toggle between positive and negative
      const currentVal = balances[item.id] !== undefined ? balances[item.id] : 0;
      const numValue = parseFloat(currentVal) || 0;
      // If the value is already a number, toggle its sign
      if (!isNaN(numValue) && numValue !== 0) {
        handleBalanceChange(item.id, -numValue);
      } else if (currentVal === '-') {
        // If it's currently a dash (user started typing negative), make it empty (positive)
        handleBalanceChange(item.id, '');
      } else {
        // Otherwise, make it negative
        handleBalanceChange(item.id, '-');
      }
    }}
    accessibilityLabel={balanceType === 'negative' ? "Make positive" : "Make negative"}
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
      balanceType === 'negative' ? styles.negativeBalance : null,
      isAutoComplete && styles.autoCompleteInput
    ]}
    keyboardType="decimal-pad"
    value={String(Math.abs(parseFloat(balance) || 0))}
    onChangeText={(value) => {
      // Always apply the correct sign when user is typing
      if (balanceType === 'negative' && value !== '' && value !== '0') {
        handleBalanceChange(item.id, -Math.abs(parseFloat(value) || 0));
      } else {
        handleBalanceChange(item.id, value);
      }
    }}
    onFocus={() => setEditingPlayerId(item.id)}
    selectTextOnFocus
    placeholder="0.00"
  />
  
  {isAutoComplete && suggestedBalance !== undefined && (
    <View style={styles.suggestedBalanceContainer}>
      <Text style={styles.suggestedBalance}>→ ${formatBalance(suggestedBalance)}</Text>
    </View>
  )}
</View>
        </View>
      </Animated.View>
    );
  };

  const renderSettlementItem = ({ item, index }) => {
    const fromPlayer = players.find(p => p.id === item.from);
    const toPlayer = players.find(p => p.id === item.to);
    
    if (!fromPlayer || !toPlayer) return null;
    
    return (
      <Animated.View
        style={[
          styles.settlementItemContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <View style={styles.settlementItem}>
          <View style={styles.settlementHeader}>
            <View style={styles.settlementNumber}>
              <Text style={styles.settlementNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.settlementAmount}>${item.amount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.settlementParties}>
            <View style={styles.settlementParty}>
              <View 
                style={[
                  styles.avatar, 
                  { backgroundColor: fromPlayer.avatarColor || getRandomColor() }
                ]}
              >
                <Text style={styles.avatarText}>{getInitials(fromPlayer.name)}</Text>
              </View>
              <View style={styles.partyInfo}>
                <Text style={styles.partyAction}>Pays</Text>
                <Text style={styles.partyName}>{fromPlayer.name}</Text>
              </View>
            </View>
            
            <MaterialIcons name="arrow-forward" size={24} color="#7F8C8D" style={styles.arrowIcon} />
            
            <View style={styles.settlementParty}>
              <View 
                style={[
                  styles.avatar, 
                  { backgroundColor: toPlayer.avatarColor || getRandomColor() }
                ]}
              >
                <Text style={styles.avatarText}>{getInitials(toPlayer.name)}</Text>
              </View>
              <View style={styles.partyInfo}>
                <Text style={styles.partyAction}>Receives</Text>
                <Text style={styles.partyName}>{toPlayer.name}</Text>
              </View>
            </View>
          </View>
        </View>
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
          <Text style={styles.headerTitle}>
            {showSettlements ? 'Settlement Plan' : 'Player Balances'}
          </Text>
          <View style={styles.headerActions}>
            {!showSettlements && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetBalances}
              >
                <MaterialIcons name="refresh" size={20} color="white" />
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetSession}
            >
              <MaterialIcons name="delete-sweep" size={20} color="white" />
              <Text style={styles.resetButtonText}>Reset Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {!showSettlements ? (
          <>
            <View style={styles.infoBar}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Players</Text>
                <Text style={styles.infoValue}>{players.length}</Text>
              </View>
              <View style={styles.infoSeparator} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Balance Sum</Text>
                <Text 
                  style={[
                    styles.infoValue,
                    Math.abs(totalBalance) < 0.01 ? styles.balanceEven : styles.balanceUneven
                  ]}
                >
                  ${totalBalance.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.infoTipButton}
                onPress={() => setShowTips(!showTips)}
              >
                <MaterialIcons 
                  name={showTips ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color="#7F8C8D" 
                />
              </TouchableOpacity>
            </View>
            
            {showTips && (
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Quick Tips:</Text>
                <Text style={styles.tipText}>• Winners have positive balances</Text>
                <Text style={styles.tipText}>• Losers have negative balances</Text>
                <Text style={styles.tipText}>• Sum of all balances must equal zero</Text>
                <Text style={styles.tipText}>• You can auto-adjust if they don't sum to zero</Text>
              </View>
            )}
            
            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <FlatList
                data={players}
                renderItem={renderPlayerBalanceItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No players added yet</Text>
                    <TouchableOpacity
                      style={styles.addPlayersButton}
                      onPress={() => navigation.navigate('Players')}
                    >
                      <Text style={styles.addPlayersButtonText}>Add Players</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
            </ScrollView>
            
            {!keyboardVisible && (
              <View style={styles.calculationButtons}>
                <TouchableOpacity
                  style={[
                    styles.calculateButton,
                    (players.length < 2 || isCalculating) && styles.disabledButton
                  ]}
                  onPress={calculateSettlements}
                  disabled={players.length < 2 || isCalculating}
                >
                  {isCalculating ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <MaterialIcons name="calculate" size={20} color="white" />
                      <Text style={styles.calculateButtonText}>Calculate Settlements</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.settlementsSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Transactions</Text>
                <Text style={styles.summaryValue}>{settlements.length}</Text>
              </View>
              <View style={styles.infoSeparator} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>
                  ${settlements.reduce((sum, settlement) => sum + settlement.amount, 0).toFixed(2)}
                </Text>
              </View>
            </View>
            
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
            >
              {settlements.length > 0 ? (
                <FlatList
                  data={settlements}
                  renderItem={renderSettlementItem}
                  keyExtractor={(item, index) => index.toString()}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.noSettlementsContainer}>
                  <MaterialIcons name="check-circle" size={50} color="#2ECC71" />
                  <Text style={styles.noSettlementsTitle}>All Even!</Text>
                  <Text style={styles.noSettlementsText}>
                    No money needs to change hands. Everyone is square.
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => setShowSettlements(false)}
              >
                <MaterialIcons name="edit" size={20} color="white" />
                <Text style={styles.actionButtonText}>Edit Balances</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={finishSession}
              >
                <MaterialIcons name="check" size={20} color="white" />
                <Text style={styles.actionButtonText}>Complete Session</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
      
      {/* Confirmation Modal */}
      <Modal
        visible={confirming}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelFinishSession}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Session</Text>
            <Text style={styles.modalText}>
              Are you sure you want to complete this session?
              This will save the settlement plan to history.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelFinishSession}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmFinishSession}
              >
                <Text style={styles.confirmButtonText}>Complete</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  resetButtonText: {
    color: 'white',
    marginLeft: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  infoSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#EAEAEA',
    marginHorizontal: 15,
  },
  balanceEven: {
    color: '#2ECC71',
  },
  balanceUneven: {
    color: '#E74C3C',
  },
  infoTipButton: {
    padding: 5,
    marginLeft: 10,
  },
  tipsContainer: {
    backgroundColor: '#FFF9E0',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1E6B2',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7F8C8D',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 100, // Extra space for bottom buttons
  },
  balanceItemContainer: {
    marginBottom: 15,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  balanceItemActive: {
    borderWidth: 2,
    borderColor: '#3498DB',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
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
    flex: 1,
  },
  balanceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  autoCompleteInput: {
    backgroundColor: '#F9F9F9',
  },
  suggestedBalanceContainer: {
    position: 'absolute',
    right: -120,
    backgroundColor: '#FFF9E0',
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F1E6B2',
  },
  suggestedBalance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7F8C8D',
  },
  calculationButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: '#F0F4F8',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  calculateButton: {
    flexDirection: 'row',
    backgroundColor: '#3498DB',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
  },
  calculateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  addPlayersButton: {
    backgroundColor: '#3498DB',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  addPlayersButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Settlements styles
  settlementsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  settlementItemContainer: {
    marginBottom: 20,
  },
  settlementItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
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
  settlementParty: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partyInfo: {
    marginLeft: 10,
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
  noSettlementsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noSettlementsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 15,
    marginBottom: 10,
  },
  noSettlementsText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#F0F4F8',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#7F8C8D',
  },
  completeButton: {
    backgroundColor: '#2ECC71',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
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
  modalText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#2ECC71',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },// Add to your styles object
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
  }
});

export default SettlementScreen;