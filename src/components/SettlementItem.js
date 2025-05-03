import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import colors from '../constants/colors';
import layout from '../constants/layout';

/**
 * SettlementItem Component
 * 
 * A reusable component for displaying settlement transactions between players.
 * 
 * @param {Object} settlement - Settlement transaction object { from, to, amount }
 * @param {Object} fromPlayer - Player object who is paying
 * @param {Object} toPlayer - Player object who is receiving
 * @param {Function} onPress - Function to call when item is pressed
 * @param {string} status - Status of the settlement ('pending', 'completed', 'cancelled')
 * @param {number} index - Index of the settlement in the list
 * @param {string} variant - Display variant ('default', 'compact', 'detail')
 */
const SettlementItem = ({
  settlement,
  fromPlayer,
  toPlayer,
  onPress,
  status = 'pending',
  index = 0,
  variant = 'default',
}) => {
  // Helper to get player initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format amount with 2 decimal places
  const formatAmount = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Get avatar background color
  const getAvatarColor = (player) => {
    return player?.avatarColor || colors.avatarColors[0];
  };

  // Get appropriate styles based on variant
  const getContainerStyle = () => {
    switch (variant) {
      case 'compact':
        return styles.compactContainer;
      case 'detail':
        return styles.detailContainer;
      default:
        return styles.container;
    }
  };

  // Get avatar size based on variant
  const getAvatarSize = () => {
    switch (variant) {
      case 'compact':
        return layout.components.avatar.xs;
      case 'detail':
        return layout.components.avatar.m;
      default:
        return layout.components.avatar.s;
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  // Render player avatar
  const renderAvatar = (player, size) => {
    if (!player) return null;
    
    return (
      <View
        style={[
          styles.avatar,
          { 
            width: size, 
            height: size,
            backgroundColor: getAvatarColor(player),
          },
        ]}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
          {getInitials(player?.name || 'Unknown')}
        </Text>
      </View>
    );
  };

  const avatarSize = getAvatarSize();

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.wrapper, getContainerStyle()]}
    >
      {/* Transaction number badge */}
      {variant !== 'compact' && (
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
      )}

      <View style={styles.contentContainer}>
        {/* Header with amount and status */}
        <View style={styles.header}>
          <Text style={styles.amountText}>
            {formatAmount(settlement.amount)}
          </Text>
          
          {variant !== 'compact' && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Transaction parties */}
        <View style={styles.partiesContainer}>
          {/* From player */}
          <View style={styles.playerContainer}>
            {renderAvatar(fromPlayer, avatarSize)}
            <View style={styles.playerInfo}>
              <Text style={styles.playerLabel}>Pays</Text>
              <Text 
                style={styles.playerName} 
                numberOfLines={1}
              >
                {fromPlayer?.name || 'Unknown Player'}
              </Text>
            </View>
          </View>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <MaterialIcons 
              name="arrow-forward" 
              size={variant === 'compact' ? 16 : 24} 
              color={colors.textLight} 
            />
          </View>

          {/* To player */}
          <View style={styles.playerContainer}>
            {renderAvatar(toPlayer, avatarSize)}
            <View style={styles.playerInfo}>
              <Text style={styles.playerLabel}>Receives</Text>
              <Text 
                style={styles.playerName} 
                numberOfLines={1}
              >
                {toPlayer?.name || 'Unknown Player'}
              </Text>
            </View>
          </View>
        </View>

        {/* Additional details for detail variant */}
        {variant === 'detail' && status !== 'pending' && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsLabel}>
              {status === 'completed' ? 'Completed on:' : 'Cancelled on:'}
            </Text>
            <Text style={styles.detailsText}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Chevron for navigation if onPress provided */}
      {onPress && variant !== 'compact' && (
        <MaterialIcons 
          name="chevron-right" 
          size={24} 
          color={colors.textLight}
          style={styles.chevron}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.m,
    marginBottom: layout.spacing.m,
    ...layout.elevation.s,
  },
  container: {
    padding: layout.spacing.m,
  },
  compactContainer: {
    padding: layout.spacing.s,
  },
  detailContainer: {
    padding: layout.spacing.l,
  },
  contentContainer: {
    flex: 1,
  },
  indexBadge: {
    position: 'absolute',
    top: -layout.spacing.s,
    left: -layout.spacing.s,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...layout.elevation.s,
    zIndex: 1,
  },
  indexText: {
    color: colors.white,
    fontSize: layout.fontSizes.s,
    fontWeight: layout.fontWeights.bold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.spacing.m,
  },
  amountText: {
    fontSize: layout.fontSizes.l,
    fontWeight: layout.fontWeights.bold,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: layout.spacing.s,
    paddingVertical: layout.spacing.xs,
    borderRadius: layout.borderRadius.s,
  },
  statusText: {
    fontSize: layout.fontSizes.xs,
    fontWeight: layout.fontWeights.medium,
    color: colors.white,
  },
  partiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: layout.spacing.s,
  },
  avatarText: {
    color: colors.white,
    fontWeight: layout.fontWeights.bold,
  },
  playerInfo: {
    flex: 1,
  },
  playerLabel: {
    fontSize: layout.fontSizes.xs,
    color: colors.textLight,
  },
  playerName: {
    fontSize: layout.fontSizes.s,
    fontWeight: layout.fontWeights.semibold,
    color: colors.text,
  },
  arrowContainer: {
    paddingHorizontal: layout.spacing.s,
    alignItems: 'center',
  },
  detailsContainer: {
    marginTop: layout.spacing.m,
    paddingTop: layout.spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailsLabel: {
    fontSize: layout.fontSizes.xs,
    color: colors.textLight,
    marginBottom: layout.spacing.xs,
  },
  detailsText: {
    fontSize: layout.fontSizes.s,
    color: colors.text,
  },
  chevron: {
    position: 'absolute',
    right: layout.spacing.m,
    top: '50%',
    marginTop: -12,
  },
});

export default SettlementItem;