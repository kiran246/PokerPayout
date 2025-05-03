/**
 * Layout Constants for Poker Settlement App
 * 
 * This file contains layout-related constants such as spacing,
 * sizing, and responsive dimensions to maintain consistency
 * throughout the app.
 */

import { Dimensions, Platform, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

// Check if device is an iPhone with notch
const isIphoneX = () => {
  const dimen = Dimensions.get('window');
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTV &&
    ((dimen.height === 780 || dimen.width === 780)
      || (dimen.height === 812 || dimen.width === 812)
      || (dimen.height === 844 || dimen.width === 844)
      || (dimen.height === 896 || dimen.width === 896)
      || (dimen.height === 926 || dimen.width === 926)
      || (dimen.height === 932 || dimen.width === 932))
  );
};

// Screen information
const screen = {
  width,
  height,
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 414,
  isLargeDevice: width >= 414,
  isIphoneX: isIphoneX(),
};

// Spacing system (for margins, paddings, gaps)
const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Typography sizes
const fontSizes = {
  xs: 12,
  s: 14,
  m: 16,
  l: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 28,
  subtitle: 18,
};

// Font weights
const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Border radiuses
const borderRadius = {
  xs: 4,
  s: 8,
  m: 10,
  l: 16,
  xl: 24,
  round: 999, // For fully rounded elements
};

// Elevations (for shadow and depth)
const elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  s: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  m: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  l: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Header heights
const header = {
  height: Platform.OS === 'ios' ? 44 : 56,
  paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  heightWithStatusBar: Platform.OS === 'ios' 
    ? 44 + (isIphoneX() ? 44 : 20) 
    : 56 + StatusBar.currentHeight,
};

// Safe area insets
const safeArea = {
  top: Platform.OS === 'ios' ? (isIphoneX() ? 44 : 20) : StatusBar.currentHeight,
  bottom: Platform.OS === 'ios' ? (isIphoneX() ? 34 : 0) : 0,
  left: Platform.OS === 'ios' ? (isIphoneX() ? 44 : 0) : 0,
  right: Platform.OS === 'ios' ? (isIphoneX() ? 44 : 0) : 0,
};

// Animation durations
const animation = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Component specific dimensions
const components = {
  avatar: {
    xs: 24,
    s: 36,
    m: 48,
    l: 64,
    xl: 96,
  },
  button: {
    height: 48,
    borderRadius: 10,
  },
  input: {
    height: 48,
    borderRadius: 10,
  },
  card: {
    borderRadius: 10,
  },
  icon: {
    xs: 16,
    s: 20,
    m: 24,
    l: 32,
    xl: 48,
  },
};

// Z-index values
const zIndex = {
  base: 1,
  card: 10,
  header: 20,
  modal: 30,
  toast: 40,
  tooltip: 50,
};

// Layout container maxWidths (for responsive design)
const container = {
  sm: 540,
  md: 720,
  lg: 960,
  xl: 1140,
};

export default {
  screen,
  spacing,
  fontSizes,
  fontWeights,
  borderRadius,
  elevation,
  header,
  safeArea,
  animation,
  components,
  zIndex,
  container,
  isIphoneX: isIphoneX(),
};