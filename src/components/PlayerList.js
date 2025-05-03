import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import PlayerItem from './PlayerItem';
import colors from '../constants/colors';
import layout from '../constants/layout';

/**
 * PlayerList Component
 * 
 * A reusable component for displaying and managing lists of players
 * with support for filtering, sorting, selection, and various actions.
 * 
 * @param {Array} players - Array of player objects to display
 * @param {boolean} loading - Whether the list is in loading state
 * @param {Function} onPlayerPress - Function to call when a player is pressed
 * @param {Function} onPlayerEdit - Function to call when a player edit is requested
 * @param {Function} onPlayerDelete - Function to call when a player delete is requested
 * @param {Function} onSelectionChange - Function to call when selection changes (multiSelect mode)
 * @param {boolean} showBalance - Whether to display player balances
 * @param {Object} balances - Object with player IDs as keys and balance values
 * @param {boolean} enableMultiSelect - Whether to enable multi-selection mode
 * @param {boolean} enableSearch - Whether to enable search functionality
 * @param {boolean} enableSorting - Whether to enable sorting functionality
 * @param {string} emptyMessage - Message to display when list is empty
 * @param {string} variant - Display variant for player items ('default', 'compact', 'detail')
 */
const PlayerList = ({
  players = [],
  loading = false,
  onPlayerPress,
  onPlayerEdit,
  onPlayerDelete,
  onSelectionChange,
  showBalance = false,
  balances = {},
  enableMultiSelect = false,
  enableSearch = true,
  enableSorting = true,
  emptyMessage = 'No players found',
  variant = 'default',
}) => {
  // State for filtered and sorted players
  const [filteredPlayers, setFilteredPlayers] = useState(players);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'date'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  
  // State for multi-select mode
  const [isMultiSelectActive, setIsMultiSelectActive] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  
  // Animation for list items
  const fadeAnim = new Animated.Value(0);
  
  // Update filtered players when players prop changes
  useEffect(() => {
    filterAndSortPlayers();
  }, [players, searchQuery, sortBy, sortOrder]);
  
  // Run entrance animation when component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: layout.animation.normal,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Filter and sort players based on current settings
  const filterAndSortPlayers = useCallback(() => {
    // Filter by search query
    let result = [...players];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(player => 
        player.name.toLowerCase().includes(query)
      );
    }
    
    // Sort by selected field
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === 'date') {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
    
    setFilteredPlayers(result);
  }, [players, searchQuery, sortBy, sortOrder]);
  
  // Toggle sort order or change sort field
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  // Toggle multi-select mode
  const toggleMultiSelect = () => {
    if (isMultiSelectActive) {
      setSelectedPlayerIds([]);
    }
    setIsMultiSelectActive(!isMultiSelectActive);
  };
  
  // Toggle selection state for a player
  const togglePlayerSelection = (player) => {
    const { id } = player;
    const newSelection = [...selectedPlayerIds];
    
    if (newSelection.includes(id)) {
      // Remove from selection
      const index = newSelection.indexOf(id);
      newSelection.splice(index, 1);
    } else {
      // Add to selection
      newSelection.push(id);
    }
    
    setSelectedPlayerIds(newSelection);
    
    // Notify parent component of selection change
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };
  
  // Select or deselect all players
  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      const allIds = filteredPlayers.map(player => player.id);
      setSelectedPlayerIds(allIds);
      if (onSelectionChange) {
        onSelectionChange(allIds);
      }
    } else {
      setSelectedPlayerIds([]);
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  };
  
  // Handle player press based on current mode
  const handlePlayerPress = (player) => {
    if (isMultiSelectActive) {
      togglePlayerSelection(player);
    } else if (onPlayerPress) {
      onPlayerPress(player);
    }
  };
  
  // Handle player long press
  const handlePlayerLongPress = (player) => {
    if (enableMultiSelect && !isMultiSelectActive) {
      setIsMultiSelectActive(true);
      setSelectedPlayerIds([player.id]);
      if (onSelectionChange) {
        onSelectionChange([player.id]);
      }
    }
  };
  
  // Handle player delete
  const handlePlayerDelete = (player) => {
    Alert.alert(
      'Delete Player',
      `Are you sure you want to delete ${player.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => onPlayerDelete && onPlayerDelete(player),
          style: 'destructive'
        }
      ]
    );
  };
  
  // Render item in FlatList
  const renderItem = ({ item, index }) => {
    const playerBalance = showBalance ? balances[item.id] : undefined;
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ 
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }}
      >
        <PlayerItem
          player={item}
          onPress={handlePlayerPress}
          onLongPress={handlePlayerLongPress}
          onEdit={onPlayerEdit}
          onDelete={handlePlayerDelete}
          isSelected={selectedPlayerIds.includes(item.id)}
          showBalance={showBalance}
          balance={playerBalance}
          showCheckbox={isMultiSelectActive}
          disableSwipe={isMultiSelectActive}
          variant={variant}
        />
      </Animated.View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>Loading players...</Text>
        </>
      ) : (
        <>
          <MaterialIcons name="person-outline" size={50} color={colors.textLight} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
          {searchQuery ? (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>Clear Search</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );

  // Render list header with search and sorting options
  const renderListHeader = () => {
    if (!enableSearch && !enableSorting && !enableMultiSelect) {
      return null;
    }
    
    return (
      <View style={styles.headerContainer}>
        {/* Search bar */}
        {enableSearch && (
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search players..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="clear" size={20} color={colors.textLight} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        
        {/* Sorting and selection options */}
        <View style={styles.optionsContainer}>
          {/* Sorting options */}
          {enableSorting && (
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'name' && styles.sortButtonActive
                ]}
                onPress={() => handleSortChange('name')}
              >
                <Text 
                  style={[
                    styles.sortButtonText,
                    sortBy === 'name' && styles.sortButtonTextActive
                  ]}
                >
                  Name
                </Text>
                {sortBy === 'name' && (
                  <MaterialIcons
                    name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'}
                    size={16}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortBy === 'date' && styles.sortButtonActive
                ]}
                onPress={() => handleSortChange('date')}
              >
                <Text 
                  style={[
                    styles.sortButtonText,
                    sortBy === 'date' && styles.sortButtonTextActive
                  ]}
                >
                  Date Added
                </Text>
                {sortBy === 'date' && (
                  <MaterialIcons
                    name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'}
                    size={16}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            </View>
          )}
          
          {/* Multi-select toggle */}
          {enableMultiSelect && (
            <TouchableOpacity
              style={[
                styles.multiSelectButton,
                isMultiSelectActive && styles.multiSelectButtonActive
              ]}
              onPress={toggleMultiSelect}
            >
              <Text 
                style={[
                  styles.multiSelectText,
                  isMultiSelectActive && styles.multiSelectTextActive
                ]}
              >
                {isMultiSelectActive ? 'Cancel' : 'Select'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Selection actions bar */}
        {isMultiSelectActive && (
          <View style={styles.selectionBar}>
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionCount}>
                {selectedPlayerIds.length} selected
              </Text>
              <TouchableOpacity
                onPress={() => handleSelectAll(selectedPlayerIds.length < filteredPlayers.length)}
              >
                <Text style={styles.selectAllText}>
                  {selectedPlayerIds.length < filteredPlayers.length
                    ? 'Select All'
                    : 'Deselect All'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPlayers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={[
          styles.listContent,
          filteredPlayers.length === 0 && styles.emptyListContent
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: layout.spacing.m,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: layout.spacing.m,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.m,
    paddingHorizontal: layout.spacing.m,
    height: 48,
    marginBottom: layout.spacing.m,
    ...layout.elevation.xs,
  },
  searchInput: {
    flex: 1,
    marginLeft: layout.spacing.s,
    fontSize: layout.fontSizes.m,
    color: colors.text,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layout.spacing.s,
    paddingHorizontal: layout.spacing.m,
    marginRight: layout.spacing.m,
    borderRadius: layout.spacing.l,
    backgroundColor: colors.searchBackground,
  },
  sortButtonActive: {
    backgroundColor: colors.primaryLight + '30', // 30% opacity
  },
  sortButtonText: {
    fontSize: layout.fontSizes.s,
    color: colors.textLight,
  },
  sortButtonTextActive: {
    fontWeight: layout.fontWeights.semibold,
    color: colors.primary,
    marginRight: layout.spacing.xs,
  },
  multiSelectButton: {
    paddingVertical: layout.spacing.s,
    paddingHorizontal: layout.spacing.m,
    borderRadius: layout.spacing.l,
    backgroundColor: colors.searchBackground,
  },
  multiSelectButtonActive: {
    backgroundColor: colors.primaryLight + '30', // 30% opacity
  },
  multiSelectText: {
    fontSize: layout.fontSizes.s,
    color: colors.textLight,
  },
  multiSelectTextActive: {
    fontWeight: layout.fontWeights.semibold,
    color: colors.primary,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.m,
    paddingHorizontal: layout.spacing.m,
    paddingVertical: layout.spacing.s,
    marginTop: layout.spacing.m,
    ...layout.elevation.xs,
  },
  selectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionCount: {
    fontWeight: layout.fontWeights.semibold,
    color: colors.text,
    marginRight: layout.spacing.m,
  },
  selectAllText: {
    color: colors.primary,
    fontWeight: layout.fontWeights.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: layout.spacing.xl,
  },
  emptyText: {
    fontSize: layout.fontSizes.m,
    color: colors.textLight,
    marginTop: layout.spacing.m,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: layout.spacing.m,
    padding: layout.spacing.m,
  },
  clearSearchText: {
    color: colors.primary,
    fontWeight: layout.fontWeights.semibold,
  },
});

export default PlayerList;