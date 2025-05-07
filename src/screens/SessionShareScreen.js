import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Linking
} from 'react-native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import sharingUtils from '../utils/sharingUtils';

const SessionShareScreen = ({ route, navigation }) => {
  const { session } = route.params;
  const { players } = useSelector(state => state.players);
  const { games } = useSelector(state => state.settlements);
  
  const [emailAddress, setEmailAddress] = useState('');
  const [shareMethod, setShareMethod] = useState(''); // 'email', 'whatsapp', 'copy', 'pdf'
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [includeAttachment, setIncludeAttachment] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [processCompleted, setProcessCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Format date from session
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format a player balance for display
  const formatBalance = (playerId) => {
    // Look for balance in session balances first
    if (session.balances && session.balances[playerId] !== undefined) {
      const balance = parseFloat(session.balances[playerId]) || 0;
      const isPositive = balance > 0;
      const prefix = isPositive ? '+' : '';
      
      return {
        formatted: `${prefix}$${Math.abs(balance).toFixed(2)}`,
        color: isPositive ? '#2ECC71' : balance < 0 ? '#E74C3C' : '#7F8C8D'
      };
    }
    
    // If not in session balances, check if there's a game with balances
    if (session.games && session.games.length > 0) {
      for (const game of session.games) {
        if (game.balances && game.balances[playerId] !== undefined) {
          const balance = parseFloat(game.balances[playerId]) || 0;
          const isPositive = balance > 0;
          const prefix = isPositive ? '+' : '';
          
          return {
            formatted: `${prefix}$${Math.abs(balance).toFixed(2)}`,
            color: isPositive ? '#2ECC71' : balance < 0 ? '#E74C3C' : '#7F8C8D'
          };
        }
      }
    }
    
    // Check current game state if it matches session ID
    if (games && games.length > 0) {
      const sessionGame = games.find(g => g.id === session.id);
      if (sessionGame && sessionGame.balances && sessionGame.balances[playerId] !== undefined) {
        const balance = parseFloat(sessionGame.balances[playerId]) || 0;
        const isPositive = balance > 0;
        const prefix = isPositive ? '+' : '';
        
        return {
          formatted: `${prefix}$${Math.abs(balance).toFixed(2)}`,
          color: isPositive ? '#2ECC71' : balance < 0 ? '#E74C3C' : '#7F8C8D'
        };
      }
    }
    
    // Default if no balance found
    return {
      formatted: '$0.00',
      color: '#7F8C8D'
    };
  };
  
  // Get player name by ID
  const getPlayerName = (playerId) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown Player';
  };
  
  // Get all players who have balances in this session
  const getSessionPlayers = () => {
    const sessionPlayerIds = new Set();
    
    // Check direct session balances
    if (session.balances) {
      Object.keys(session.balances).forEach(id => sessionPlayerIds.add(id));
    }
    
    // Check game balances
    if (session.games && session.games.length > 0) {
      session.games.forEach(game => {
        if (game.balances) {
          Object.keys(game.balances).forEach(id => sessionPlayerIds.add(id));
        }
        if (game.players) {
          game.players.forEach(player => sessionPlayerIds.add(player.playerId));
        }
      });
    }
    
    // Get the full player objects
    return Array.from(sessionPlayerIds).map(id => {
      const player = players.find(p => p.id === id);
      return {
        id,
        name: player ? player.name : 'Unknown Player'
      };
    });
  };
  
  // Handle share via email
  const handleShareViaEmail = () => {
    setShareMethod('email');
    setShowEmailModal(true);
  };
  
  // Send email with session details
  const sendEmail = async () => {
    if (!emailAddress.trim()) {
      Alert.alert('Email Required', 'Please enter an email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setIsPreviewMode(false);
    
    try {
      const result = await sharingUtils.emailSession(session, players, {
        to: emailAddress,
        subject: `Poker Settlement: ${new Date(session.date).toLocaleDateString()}`,
        attachPdf: includeAttachment
      });
      
      if (result.success) {
        setProcessCompleted(true);
        setSuccessMessage('Email sent successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to send email');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Error sending email:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle share via WhatsApp
  const handleShareViaWhatsApp = async () => {
    setShareMethod('whatsapp');
    setIsLoading(true);
    setIsPreviewMode(false);
    
    try {
      const result = await sharingUtils.shareViaWhatsApp(session, players);
      
      if (result.success) {
        setProcessCompleted(true);
        setSuccessMessage('Shared to WhatsApp successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to share to WhatsApp');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Error sharing to WhatsApp:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    setShareMethod('copy');
    setIsLoading(true);
    setIsPreviewMode(false);
    
    try {
      const text = sharingUtils.formatSessionAsText(session, players);
      await Clipboard.setStringAsync(text);
      setProcessCompleted(true);
      setSuccessMessage('Copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
      console.error('Error copying to clipboard:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate and share PDF
  const handleGeneratePdf = async () => {
    setShareMethod('pdf');
    setIsLoading(true);
    setIsPreviewMode(false);
    
    try {
      const pdfUri = await sharingUtils.generatePdf(session, players);
      
      if (pdfUri) {
        const result = await sharingUtils.shareSession(session, players);
        if (result.success) {
          setProcessCompleted(true);
          setSuccessMessage('PDF generated and shared!');
        } else {
          Alert.alert('Error', result.error || 'Failed to share PDF');
        }
      } else {
        Alert.alert('Error', 'Failed to generate PDF');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Error generating PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reset sharing process to start
  const resetShareProcess = () => {
    setShareMethod('');
    setIsPreviewMode(true);
    setProcessCompleted(false);
    setSuccessMessage('');
  };
  
  // Render preview mode with share options
  const renderPreviewMode = () => {
    const sessionPlayers = getSessionPlayers();
    
    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.previewCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
          </View>
          
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Final Balances</Text>
          </View>
          
          {sessionPlayers.length > 0 ? (
            sessionPlayers.map(player => {
              const balance = formatBalance(player.id);
              return (
                <View key={player.id} style={styles.balanceRow}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={[styles.balanceText, { color: balance.color }]}>
                    {balance.formatted}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyBalances}>
              <Text style={styles.emptyText}>No player balances found</Text>
            </View>
          )}
          
          <View style={styles.sectionTitle}>
            <Text style={styles.sectionTitleText}>Settlements</Text>
          </View>
          
          {session.settlements && session.settlements.length > 0 ? (
            session.settlements.map((settlement, index) => (
              <View key={index} style={styles.settlementRow}>
                <View style={styles.settlementNumber}>
                  <Text style={styles.settlementNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.settlementDetails}>
                  <Text style={styles.settlementText}>
                    {getPlayerName(settlement.from)} pays {getPlayerName(settlement.to)}
                  </Text>
                  <Text style={styles.settlementAmount}>
                    ${settlement.amount.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptySettlements}>
              <Text style={styles.emptySettlementsText}>
                No settlements needed
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.shareOptions}>
          <TouchableOpacity
            style={styles.shareOption}
            onPress={handleShareViaEmail}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#E74C3C' }]}>
              <MaterialIcons name="email" size={24} color="white" />
            </View>
            <Text style={styles.shareOptionText}>Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.shareOption}
            onPress={handleShareViaWhatsApp}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#25D366' }]}>
              <FontAwesome name="whatsapp" size={24} color="white" />
            </View>
            <Text style={styles.shareOptionText}>WhatsApp</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.shareOption}
            onPress={handleCopyToClipboard}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#3498DB' }]}>
              <MaterialIcons name="content-copy" size={24} color="white" />
            </View>
            <Text style={styles.shareOptionText}>Copy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.shareOption}
            onPress={handleGeneratePdf}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#9B59B6' }]}>
              <MaterialIcons name="picture-as-pdf" size={24} color="white" />
            </View>
            <Text style={styles.shareOptionText}>PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };
  
  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3498DB" />
      <Text style={styles.loadingText}>
        {shareMethod === 'email' && 'Preparing email...'}
        {shareMethod === 'whatsapp' && 'Opening WhatsApp...'}
        {shareMethod === 'copy' && 'Copying to clipboard...'}
        {shareMethod === 'pdf' && 'Generating PDF...'}
      </Text>
    </View>
  );
  
  // Render completed state
  const renderCompletedState = () => (
    <View style={styles.completedContainer}>
      <View style={styles.successIcon}>
        <MaterialIcons name="check-circle" size={80} color="#2ECC71" />
      </View>
      
      <Text style={styles.successMessage}>{successMessage}</Text>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={resetShareProcess}
      >
        <Text style={styles.backButtonText}>Share Another Way</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
  
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
          <Text style={styles.headerTitle}>Share Session</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>
      
      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {isPreviewMode ? (
          renderPreviewMode()
        ) : isLoading ? (
          renderLoadingState()
        ) : processCompleted ? (
          renderCompletedState()
        ) : null}
      </KeyboardAvoidingView>
      
      {/* Email Modal */}
      <Modal
        visible={showEmailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send via Email</Text>
            
            <TextInput
              style={styles.emailInput}
              value={emailAddress}
              onChangeText={setEmailAddress}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.attachmentOption}>
              <Text style={styles.attachmentLabel}>
                Include PDF attachment
              </Text>
              <TouchableOpacity
                onPress={() => setIncludeAttachment(!includeAttachment)}
              >
                <View style={styles.checkbox}>
                  {includeAttachment && (
                    <MaterialIcons name="check" size={20} color="#3498DB" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEmailModal(false);
                  setEmailAddress('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => {
                  setShowEmailModal(false);
                  sendEmail();
                }}
              >
                <Text style={styles.sendButtonText}>Send</Text>
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
  backButton: {
    padding: 8,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  sectionTitle: {
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    marginBottom: 15,
    paddingBottom: 5,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  playerName: {
    fontSize: 16,
    color: '#2C3E50',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyBalances: {
    padding: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    fontWeight: 'bold',
    fontSize: 12,
  },
  settlementDetails: {
    flex: 1,
  },
  settlementText: {
    fontSize: 15,
    color: '#2C3E50',
  },
  settlementAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 2,
  },
  emptySettlements: {
    padding: 10,
    alignItems: 'center',
  },
  emptySettlementsText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  shareOption: {
    width: '45%',
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
  shareIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#2C3E50',
    marginTop: 20,
    textAlign: 'center',
  },
  // Completed state styles
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successMessage: {
    fontSize: 20,
    color: '#2C3E50',
    marginBottom: 30,
    textAlign: 'center',
  },
  backButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#3498DB',
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: 'bold',
  },
  doneButton: {
    padding: 15,
    backgroundColor: '#3498DB',
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  // Email modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    marginBottom: 20,
    textAlign: 'center',
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  attachmentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  attachmentLabel: {
    fontSize: 16,
    color: '#2C3E50',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#3498DB',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  sendButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#3498DB',
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SessionShareScreen;