import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import SettlementItem from './SettlementItem';
import colors from '../constants/colors';
import layout from '../constants/layout';

/**
 * SettlementList Component
 * 
 * A reusable component for displaying lists of settlement transactions
 * with filtering, sorting, and grouping options.
 * 
 * @param {Array} settlements - Array of settlement objects to display
 * @param {Array} players - Array of player objects for reference
 * @param {boolean} loading - Whether the list is in loading state
 * @param {Function} onSettlementPress - Function to call when a settlement is pressed
 * @param {Function} onStatusChange - Function to call when settlement status changes
 * @param {string} emptyMessage - Message to display when list is empty
 * @param {string} variant - Display variant for settlement items ('default', 'compact', 'detail')
 * @param {boolean} showTotalAmount - Whether to show total settlement amount
 * @param {string} filter - Filter settlements by status ('all', 'pending', 'completed', 'cancelled')
 */
const SettlementList = ({
  settlements = [],
  players = [],
  loading = false,
  onSettlementPress,
  onStatusChange,
  emptyMessage = 'No settlements found',
  variant = 'default',
  showTotalAmount = true,
  filter = 'all',
}) => {
  // State for filtered settlements
  const [filteredSettlements, setFilteredSettlements] = useState(settlements);
  const [activeFilter, setActiveFilter] = useState(filter);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Animation for list items
  const fadeAnim = new Animated.Value(0);
  
  // Update filtered settlements when settlements prop changes or filter changes
  useEffect(() => {
    filterSettlements(activeFilter);
  }, [settlements, activeFilter]);
  
  // Run entrance animation when component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: layout.animation.normal,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Filter settlements based on filter value
  const filterSettlements = useCallback((filterValue) => {
    let result = [...settlements];
    
    // Apply filter
    if (filterValue !== 'all') {
      result = result.filter(item => item.status === filterValue);
    }
    
    // Calculate total amount
    const total = result.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    setTotalAmount(total);
    
    setFilteredSettlements(result);
  }, [settlements]);
  
  // Change active filter
  const handleFilterChange = (newFilter) => {
    setActiveFilter(newFilter);
  };
  
  // Find player by ID
  const findPlayerById = (playerId) => {
    return players.find(player => player.id === playerId);
  };
  
  // Handle settlement status change
  const handleStatusChange = (settlement, newStatus) => {
    if (onStatusChange) {
      onStatusChange(settlement, newStatus);
    }
  };
  
  // Render item in FlatList
  const renderItem = ({ item, index }) => {
    const fromPlayer = findPlayerById(item.from);
    const toPlayer = findPlayerById(item.to);
    
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
        <SettlementItem
          settlement={item}
          fromPlayer={fromPlayer}
          toPlayer={toPlayer}
          onPress={onSettlementPress ? () => onSettlementPress(item) : null}
          status={item.status || 'pending'}
          index={index}
          variant={variant}
        />
      </Animated.View>
    );
  };

  // Render the filter tabs
  const renderFilterTabs = () => (
    <View style={styles.filterTabsContainer}>
      <TouchableOpacity
        style={[
          styles.filterTab,
          activeFilter === 'all' && styles.activeFilterTab
        ]}
        onPress={() => handleFilterChange('all')}
      >
        <Text
          style={[
            styles.filterTabText,
            activeFilter === 'all' && styles.activeFilterTabText
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterTab,
          activeFilter === 'pending' && styles.activeFilterTab
        ]}
        onPress={() => handleFilterChange('pending')}
      >
        <Text
          style={[
            styles.filterTabText,
            activeFilter === 'pending' && styles.activeFilterTabText
          ]}
        >
          Pending
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterTab,
          activeFilter === 'completed' && styles.activeFilterTab
        ]}
        onPress={() => handleFilterChange('completed')}
      >
        <Text
          style={[
            styles.filterTabText,
            activeFilter === 'completed' && styles.activeFilterTabText
          ]}
        >
          Completed
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.filterTab,
          activeFilter === 'cancelled' && styles.activeFilterTab
        ]}
        onPress={() => handleFilterChange('cancelled')}
      >
        <Text
          style={[
            styles.filterTabText,
            activeFilter === 'cancelled' && styles.activeFilterTabText
          ]}
        >
          Cancelled
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render settlement actions for a specific settlement
  const renderSettlementActions = (settlement) => (
    <View style={styles.settlementActions}>
      {settlement.status === 'pending' && (
        <>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleStatusChange(settlement, 'completed')}
          >
            <MaterialIcons name="check" size={16} color="white" />
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleStatusChange(settlement, 'cancelled')}
          >
            <MaterialIcons name="close" size={16} color="white" />
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
      
      {settlement.status === 'completed' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={() => handleStatusChange(settlement, 'pending')}
        >
          <MaterialIcons name="refresh" size={16} color="white" />
          <Text style={styles.actionButtonText}>Reset</Text>
        </TouchableOpacity>
      )}
      
      {settlement.status === 'cancelled' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.resetButton]}
          onPress={() => handleStatusChange(settlement, 'pending')}
        >
          <MaterialIcons name="refresh" size={16} color="white" />
          <Text style={styles.actionButtonText}>Reset</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render summary info
  const renderSummary = () => {
    if (!showTotalAmount || filteredSettlements.length === 0) {
      return null;
    }
    
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>
            {filteredSettlements.length}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValue}>
            ${totalAmount.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>Loading settlements...</Text>
        </>
      ) : (
        <>
          <MaterialIcons name="account-balance-wallet" size={50} color={colors.textLight} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
          {activeFilter !== 'all' && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={styles.viewAllText}>View All Settlements</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      {renderFilterTabs()}
      
      {/* Summary */}
      {renderSummary()}
      
      {/* Settlements list */}
      <FlatList
        data={filteredSettlements}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id || index.toString()}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          filteredSettlements.length === 0 && styles.emptyListContent
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
  filterTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginBottom: layout.spacing.m,
    borderRadius: layout.borderRadius.m,
    ...layout.elevation.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: layout.spacing.m,
    alignItems: 'center',
  },
  activeFilterTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  filterTabText: {
    fontSize: layout.fontSizes.s,
    color: colors.textLight,
  },
  activeFilterTabText: {
    color: colors.primary,
    fontWeight: layout.fontWeights.semibold,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: layout.spacing.m,
    marginBottom: layout.spacing.m,
    borderRadius: layout.borderRadius.m,
    ...layout.elevation.xs,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: layout.fontSizes.xs,
    color: colors.textLight,
    marginBottom: layout.spacing.xs,
  },
  summaryValue: {
    fontSize: layout.fontSizes.l,
    fontWeight: layout.fontWeights.bold,
    color: colors.text,
  },
  listContent: {
    padding: layout.spacing.m,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
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
  viewAllButton: {
    marginTop: layout.spacing.m,
    padding: layout.spacing.m,
  },
  viewAllText: {
    color: colors.primary,
    fontWeight: layout.fontWeights.semibold,
  },
  settlementActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: layout.spacing.m,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layout.spacing.xs,
    paddingHorizontal: layout.spacing.m,
    borderRadius: layout.borderRadius.s,
    marginLeft: layout.spacing.s,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: layout.fontSizes.xs,
    fontWeight: layout.fontWeights.medium,
    marginLeft: layout.spacing.xs,
  },
  completeButton: {
    backgroundColor: colors.success,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  resetButton: {
    backgroundColor: colors.warning,
  },
});

export default SettlementList;