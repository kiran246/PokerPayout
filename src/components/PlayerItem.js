import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

import colors from '../constants/colors';
import layout from '../constants/layout';

/**
 * PlayerItem Component
 * 
 * A reusable component for displaying player information in lists
 * with support for swipe actions, selection, and various display modes.
 * 
 * @param {Object} player - Player data object
 * @param {Function} onPress - Function to call when item is pressed
 * @param {Function} onLongPress - Function to call when item is long-pressed
 * @param {Function} onEdit - Function to call when edit action is triggered
 * @param {Function} onDelete - Function to call when delete action is triggered
 * @param {boolean} isSelected - Whether the item is in selected state
 * @param {boolean} showBalance - Whether to display the player's balance
 * @param {number|string} balance - The player's balance value
 * @param {boolean} showCheckbox - Whether to show selection checkbox
 * @param {boolean} disableSwipe - Whether to disable swipe actions
 * @param {string} variant - Display variant ('default', 'compact', 'detail')
 */
const PlayerItem = ({
  player,
  onPress,
  onLongPress,
  onEdit,
  onDelete,
  isSelected = false,
  showBalance = false,
  balance = 0,
  showCheckbox = false,
  disableSwipe = false,
  variant = 'default',
}) => {
  // Create a reference to the swipeable component
  const swipeableRef = React.useRef(null);

  // Get initials from player name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format balance for display
  const formatBalance = (value) => {
    const numValue = parseFloat(value) || 0;
    const isPositive = numValue > 0;
    const formattedValue = Math.abs(numValue).toFixed(2);
    
    return {
      value: `${isPositive ? '+' : ''}$${formattedValue}`,
      color: numValue > 0 
        ? colors.positive 
        : numValue < 0 
          ? colors.negative 
          : colors.neutral
    };
  };

  // Close swipe actions
  const closeSwipeable = () => {
    if (swipeableRef.current) {
      swipeableRef.current.close();
    }
  };

  // Render swipe actions
  const renderRightActions = (progress, dragX) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeableActions}>
        <Animated.View
          style={[
            styles.swipeAction,
            styles.editAction,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              closeSwipeable();
              onEdit && onEdit(player);
            }}
            style={styles.swipeActionButton}
          >
            <MaterialIcons name="edit" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View
          style={[
            styles.swipeAction,
            styles.deleteAction,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              closeSwipeable();
              onDelete && onDelete(player);
            }}
            style={styles.swipeActionButton}
          >
            <MaterialIcons name="delete" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // Determine the correct styles based on variant
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

  // Determine the avatar size based on variant
  const getAvatarSize = () => {
    switch (variant) {
      case 'compact':
        return layout.components.avatar.s;
      case 'detail':
        return layout.components.avatar.l;
      default:
        return layout.components.avatar.m;
    }
  };

  // Render avatar based on player data
  const renderAvatar = () => {
    const size = getAvatarSize();
    
    return (
      <View
        style={[
          styles.avatar,
          { 
            width: size, 
            height: size,
            backgroundColor: player.avatarColor || colors.avatarColors[0],
          },
        ]}
      >
        <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
          {getInitials(player.name)}
        </Text>
      </View>
    );
  };

  // Main component content
  const mainContent = (
    <View style={[styles.contentContainer, getContainerStyle()]}>
      {/* Checkbox for selection mode */}
      {showCheckbox && (
        <View style={styles.checkboxContainer}>
          <View
            style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
            ]}
          >
            {isSelected && (
              <MaterialIcons name="check" size={16} color="white" />
            )}
          </View>
        </View>
      )}

      {/* Player avatar */}
      <View style={styles.avatarContainer}>
        {renderAvatar()}
      </View>

      {/* Player details */}
      <View style={styles.playerInfo}>
        <Text style={styles.playerName} numberOfLines={1}>
          {player.name}
        </Text>
        
        {player.createdAt && variant !== 'compact' && (
          <Text style={styles.playerDate}>
            Added {formatDate(player.createdAt)}
          </Text>
        )}
        
        {variant === 'detail' && player.email && (
          <Text style={styles.playerEmail}>{player.email}</Text>
        )}
      </View>

      {/* Balance display (if enabled) */}
      {showBalance && (
        <View style={styles.balanceContainer}>
          {typeof balance === 'number' || typeof balance === 'string' ? (
            <Text 
              style={[
                styles.balanceText, 
                { color: formatBalance(balance).color }
              ]}
            >
              {formatBalance(balance).value}
            </Text>
          ) : (
            <Text style={styles.balancePlaceholder}>--</Text>
          )}
        </View>
      )}

      {/* Right chevron (if not showing balance) */}
      {!showBalance && !showCheckbox && variant !== 'detail' && (
        <MaterialIcons
          name="chevron-right"
          size={24}
          color={colors.textLight}
          style={styles.chevron}
        />
      )}
    </View>
  );

  // Wrap with Swipeable if swipe actions are enabled
  if (onEdit || onDelete) {
    return disableSwipe ? (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress && onPress(player)}
        onLongPress={() => onLongPress && onLongPress(player)}
      >
        {mainContent}
      </TouchableOpacity>
    ) : (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            closeSwipeable();
            onPress && onPress(player);
          }}
          onLongPress={() => {
            closeSwipeable();
            onLongPress && onLongPress(player);
          }}
        >
          {mainContent}
        </TouchableOpacity>
      </Swipeable>
    );
  }

  // Return without Swipeable if no swipe actions
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress && onPress(player)}
      onLongPress={() => onLongPress && onLongPress(player)}
    >
      {mainContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: layout.borderRadius.m,
    padding: layout.spacing.m,
    marginBottom: layout.spacing.m,
    ...layout.elevation.s,
  },
  container: {
    minHeight: 70,
  },
  compactContainer: {
    minHeight: 50,
    padding: layout.spacing.s,
  },
  detailContainer: {
    minHeight: 90,
    padding: layout.spacing.l,
  },
  checkboxContainer: {
    marginRight: layout.spacing.m,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
  },
  avatarContainer: {
    marginRight: layout.spacing.m,
  },
  avatar: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontWeight: layout.fontWeights.bold,
  },
  playerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  playerName: {
    fontSize: layout.fontSizes.m,
    fontWeight: layout.fontWeights.semibold,
    color: colors.text,
  },
  playerDate: {
    fontSize: layout.fontSizes.xs,
    color: colors.textLight,
    marginTop: layout.spacing.xs,
  },
  playerEmail: {
    fontSize: layout.fontSizes.s,
    color: colors.textLight,
    marginTop: layout.spacing.xs,
  },
  balanceContainer: {
    marginLeft: layout.spacing.m,
  },
  balanceText: {
    fontSize: layout.fontSizes.m,
    fontWeight: layout.fontWeights.bold,
  },
  balancePlaceholder: {
    fontSize: layout.fontSizes.m,
    color: colors.textLight,
  },
  chevron: {
    marginLeft: layout.spacing.s,
  },
  swipeableActions: {
    width: 120,
    flexDirection: 'row',
  },
  swipeAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAction: {
    backgroundColor: colors.primary,
  },
  deleteAction: {
    backgroundColor: colors.error,
  },
});

export default PlayerItem;