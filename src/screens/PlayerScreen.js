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
  Keyboard,
  Modal,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addPlayer, updatePlayer, deletePlayer, setPlayers } from '../store/playerSlice';
import { loadPlayers, savePlayers } from '../api/storage';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import analyticsUtils from '../utils/analyticsUtils';

const PlayerScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { players, loading } = useSelector(state => state.players);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'date'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [isMultiSelectActive, setIsMultiSelectActive] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Reference to input for focusing
  const newPlayerInputRef = useRef(null);
  
  useEffect(() => {
    // Load players from storage when component mounts
    const fetchPlayers = async () => {
      const storedPlayers = await loadPlayers();
      if (storedPlayers.length > 0) {
        dispatch(setPlayers(storedPlayers));
      }
      
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
    };
    
    fetchPlayers();
  }, [dispatch, fadeAnim, slideAnim]);

  useEffect(() => {
    // Save players to storage whenever they change
    if (players.length > 0) {
      savePlayers(players);
    }
  }, [players]);

  // Handle keyboard open/close to adjust view
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        if (isAddModalVisible && newPlayerInputRef.current) {
          newPlayerInputRef.current.focus();
        }
      }
    );
    
    return () => {
      keyboardDidShowListener.remove();
    };
  }, [isAddModalVisible]);

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      // Check if player with this name already exists
      const playerExists = players.some(
        player => player.name.toLowerCase() === newPlayerName.trim().toLowerCase()
      );
      
      if (playerExists) {
        Alert.alert(
          'Duplicate Player',
          'A player with this name already exists.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      dispatch(addPlayer({ 
        name: newPlayerName.trim(),
        avatarColor: getRandomColor()
      }));
      setNewPlayerName('');
      setIsAddModalVisible(false);
    } else {
      Alert.alert(
        'Invalid Name',
        'Please enter a valid player name.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleUpdatePlayer = () => {
    if (editingName.trim() && editingId) {
      // Check if player with this name already exists (excluding current player)
      const playerExists = players.some(
        player => player.id !== editingId && 
                player.name.toLowerCase() === editingName.trim().toLowerCase()
      );
      
      if (playerExists) {
        Alert.alert(
          'Duplicate Player',
          'A player with this name already exists.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      dispatch(updatePlayer({ id: editingId, name: editingName.trim() }));
      setEditingId(null);
      setEditingName('');
    } else {
      Alert.alert(
        'Invalid Name',
        'Please enter a valid player name.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeletePlayer = (id) => {
    const playerToDelete = players.find(p => p.id === id);
    
    Alert.alert(
      'Delete Player',
      `Are you sure you want to delete ${playerToDelete.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => dispatch(deletePlayer(id)),
          style: 'destructive'
        }
      ]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedPlayerIds.length === 0) return;
    
    Alert.alert(
      'Delete Selected Players',
      `Are you sure you want to delete ${selectedPlayerIds.length} player(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => {
            selectedPlayerIds.forEach(id => {
              dispatch(deletePlayer(id));
            });
            setSelectedPlayerIds([]);
            setIsMultiSelectActive(false);
          },
          style: 'destructive'
        }
      ]
    );
  };

  const startEditing = (id, name) => {
    setEditingId(id);
    setEditingName(name);
  };
  
  const handleViewAnalytics = (player) => {
    navigation.navigate('PlayerAnalytics', { player });
  };

  const togglePlayerSelection = (id) => {
    if (selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds(selectedPlayerIds.filter(playerId => playerId !== id));
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectActive(!isMultiSelectActive);
    if (isMultiSelectActive) {
      setSelectedPlayerIds([]);
    }
  };

  const handlePlayerLongPress = (player) => {
    if (enableMultiSelect && !isMultiSelectActive) {
      setIsMultiSelectActive(true);
      setSelectedPlayerIds([player.id]);
      if (onSelectionChange) {
        onSelectionChange([player.id]);
      }
    } else {
      // Show options when long press
      Alert.alert(
        'Player Options',
        `Choose an action for ${player.name}`,
        [
          {
            text: 'Edit',
            onPress: () => startEditing(player.id, player.name),
          },
          {
            text: 'View Analytics',
            onPress: () => handleViewAnalytics(player),
          },
          {
            text: 'Delete',
            onPress: () => handleDeletePlayer(player.id),
            style: 'destructive',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  // Filter players based on search query
  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'name') {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    } else { // sort by date
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }
  });

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

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const changeSortBy = (newSortBy) => {
    if (sortBy === newSortBy) {
      toggleSortOrder();
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const renderRightActions = (id) => {
    return (
      <View style={styles.swipeableActions}>
        <TouchableOpacity
          style={[styles.swipeableButton, styles.analyticsButton]}
          onPress={() => {
            const player = players.find(p => p.id === id);
            if (player) handleViewAnalytics(player);
          }}
        >
          <MaterialIcons name="analytics" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeableButton, styles.editButton]}
          onPress={() => {
            const player = players.find(p => p.id === id);
            if (player) startEditing(id, player.name);
          }}
        >
          <MaterialIcons name="edit" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeableButton, styles.deleteButton]}
          onPress={() => handleDeletePlayer(id)}
        >
          <MaterialIcons name="delete" size={24} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderPlayerItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.animatedContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {editingId === item.id ? (
        <View style={styles.editContainer}>
          <View style={styles.avatarContainer}>
            <View 
              style={[
                styles.avatar, 
                { backgroundColor: item.avatarColor || getRandomColor() }
              ]}
            >
              <Text style={styles.avatarText}>{getInitials(editingName || item.name)}</Text>
            </View>
          </View>
          <View style={styles.editInputContainer}>
            <TextInput
              style={styles.editInput}
              value={editingName}
              onChangeText={setEditingName}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setEditingId(null)}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleUpdatePlayer}
              >
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <Swipeable
          renderRightActions={() => renderRightActions(item.id)}
          enabled={!isMultiSelectActive}
        >
          <TouchableOpacity
            style={[
              styles.playerItem,
              selectedPlayerIds.includes(item.id) && styles.selectedPlayerItem
            ]}
            onPress={() => isMultiSelectActive ? togglePlayerSelection(item.id) : startEditing(item.id, item.name)}
            onLongPress={() => handlePlayerLongPress(item)}
            delayLongPress={300}
          >
            {isMultiSelectActive && (
              <View style={styles.checkboxContainer}>
                <View style={[
                  styles.checkbox,
                  selectedPlayerIds.includes(item.id) && styles.checkboxSelected
                ]}>
                  {selectedPlayerIds.includes(item.id) && (
                    <MaterialIcons name="check" size={18} color="white" />
                  )}
                </View>
              </View>
            )}
            
            <View style={styles.avatarContainer}>
              <View 
                style={[
                  styles.avatar, 
                  { backgroundColor: item.avatarColor || getRandomColor() }
                ]}
              >
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
              </View>
            </View>
            
            <View style={styles.playerDetails}>
              <Text style={styles.playerName}>{item.name}</Text>
              <Text style={styles.playerDate}>
                Added {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            
            {!isMultiSelectActive && (
              <MaterialIcons 
                name="chevron-right" 
                size={24} 
                color="#BDC3C7" 
                style={styles.chevron}
              />
            )}
          </TouchableOpacity>
        </Swipeable>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2C3E50', '#4CA1AF']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Players</Text>
          {players.length > 0 && (
            <TouchableOpacity
              style={styles.multiSelectButton}
              onPress={toggleMultiSelectMode}
            >
              <Text style={styles.multiSelectText}>
                {isMultiSelectActive ? 'Cancel' : 'Select'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Search and sort bar */}
        {players.length > 0 && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <MaterialIcons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search players..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>
            
            <View style={styles.sortButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'name' && styles.activeSortButton
                ]}
                onPress={() => changeSortBy('name')}
              >
                <Text 
                  style={[
                    styles.sortButtonText,
                    sortBy === 'name' && styles.activeSortButtonText
                  ]}
                >
                  Name
                </Text>
                {sortBy === 'name' && (
                  <MaterialIcons 
                    name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} 
                    size={16} 
                    color="#3498DB" 
                  />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'date' && styles.activeSortButton
                ]}
                onPress={() => changeSortBy('date')}
              >
                <Text 
                  style={[
                    styles.sortButtonText,
                    sortBy === 'date' && styles.activeSortButtonText
                  ]}
                >
                  Date
                </Text>
                {sortBy === 'date' && (
                  <MaterialIcons 
                    name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} 
                    size={16} 
                    color="#3498DB" 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bulk actions bar when in multi-select mode */}
        {isMultiSelectActive && players.length > 0 && (
          <View style={styles.bulkActionsBar}>
            <Text style={styles.selectedCountText}>
              {selectedPlayerIds.length} selected
            </Text>
            
            <TouchableOpacity
              style={[
                styles.bulkActionButton,
                styles.bulkDeleteButton,
                selectedPlayerIds.length === 0 && styles.disabledButton
              ]}
              onPress={handleDeleteSelected}
              disabled={selectedPlayerIds.length === 0}
            >
              <MaterialIcons name="delete" size={20} color="white" />
              <Text style={styles.bulkActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading indicator */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498DB" />
            <Text style={styles.loadingText}>Loading players...</Text>
          </View>
        ) : (
          <>
            {/* Player list */}
            <FlatList
              data={sortedPlayers}
              renderItem={renderPlayerItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <FontAwesome5 name="users" size={50} color="#BDC3C7" />
                  <Text style={styles.emptyText}>No players added yet</Text>
                  <Text style={styles.emptySubText}>
                    Add your first player by tapping the button below
                  </Text>
                </View>
              }
            />
            
            {/* Add player floating button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAddModalVisible(true)}
            >
              <MaterialIcons name="add" size={30} color="white" />
            </TouchableOpacity>
          </>
        )}

        {/* Add Player Modal */}
        <Modal
          visible={isAddModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsAddModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Player</Text>
              
              <TextInput
                ref={newPlayerInputRef}
                style={styles.modalInput}
                placeholder="Player name"
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                autoFocus
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => {
                    setNewPlayerName('');
                    setIsAddModalVisible(false);
                  }}
                >
                  <Text style={styles.cancelModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    styles.addModalButton,
                    !newPlayerName.trim() && styles.disabledButton
                  ]}
                  onPress={handleAddPlayer}
                  disabled={!newPlayerName.trim()}
                >
                  <Text style={styles.addModalButtonText}>Add Player</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
  multiSelectButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  multiSelectText: {
    color: 'white',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  searchContainer: {
    flexDirection: 'column',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#2C3E50',
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 15,
    backgroundColor: '#F0F4F8',
  },
  activeSortButton: {
    backgroundColor: '#E1F0FF',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginRight: 5,
  },
  activeSortButtonText: {
    color: '#3498DB',
    fontWeight: '600',
  },
  bulkActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#34495E',
  },
  selectedCountText: {
    color: 'white',
    fontWeight: '600',
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  bulkDeleteButton: {
    backgroundColor: '#E74C3C',
  },
  bulkActionText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  listContent: {
    padding: 15,
    paddingBottom: 80, // Space for the FAB
  },
  animatedContainer: {
    marginBottom: 10,
  },
  playerItem: {
    flexDirection: 'row',
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
  selectedPlayerItem: {
    backgroundColor: '#E1F0FF',
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3498DB',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  playerDate: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 3,
  },
  chevron: {
    marginLeft: 10,
  },
  editContainer: {
    flexDirection: 'row',
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
  editInputContainer: {
    flex: 1,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#3498DB',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    color: '#2C3E50',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#95A5A6',
  },
  saveButton: {
    backgroundColor: '#3498DB',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  swipeableActions: {
    flexDirection: 'row',
    width: 180,
    justifyContent: 'space-between',
  },
  swipeableButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsButton: {
    backgroundColor: '#9B59B6',
  },
  editButton: {
    backgroundColor: '#3498DB',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#F0F4F8',
    marginRight: 10,
  },
  cancelModalButtonText: {
    color: '#7F8C8D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addModalButton: {
    backgroundColor: '#3498DB',
    marginLeft: 10,
  },
  addModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PlayerScreen;