/**
 * Color Constants for Poker Settlement App
 * 
 * This file contains all the color definitions used throughout the app.
 * Centralizing colors here makes it easy to maintain a consistent look
 * and simplifies theme changes.
 */

// Main palette
const palette = {
    // Primary colors
    blue: {
      light: '#5DADE2',
      default: '#3498DB',
      dark: '#2980B9',
    },
    green: {
      light: '#58D68D',
      default: '#2ECC71',
      dark: '#27AE60',
    },
    red: {
      light: '#EC7063',
      default: '#E74C3C',
      dark: '#C0392B',
    },
    orange: {
      light: '#F5B041',
      default: '#F39C12',
      dark: '#D35400',
    },
    purple: {
      light: '#BB8FCE',
      default: '#9B59B6',
      dark: '#8E44AD',
    },
    turquoise: {
      light: '#48C9B0',
      default: '#1ABC9C',
      dark: '#16A085',
    },
  
    // Neutral colors
    grey: {
      lightest: '#F8F9F9',
      lighter: '#F0F4F8',
      light: '#EAECEE',
      medium: '#BDC3C7',
      dark: '#95A5A6',
      darker: '#7F8C8D',
      darkest: '#34495E',
    },
    
    // Black and white
    black: '#2C3E50',
    white: '#FFFFFF',
    
    // Transparent colors
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.5)',
    lightOverlay: 'rgba(255, 255, 255, 0.8)',
  };
  
  // Theme colors (semantic naming)
  const colors = {
    // App theme
    primary: palette.blue.default,
    primaryLight: palette.blue.light,
    primaryDark: palette.blue.dark,
    secondary: palette.purple.default,
    secondaryLight: palette.purple.light,
    secondaryDark: palette.purple.dark,
    
    // UI elements
    background: palette.grey.lighter,
    card: palette.white,
    surface: palette.white,
    header: palette.black,
    headerGradientStart: palette.black,
    headerGradientEnd: '#4CA1AF',
    
    // Text
    text: palette.black,
    textSecondary: palette.grey.darker,
    textLight: palette.grey.darker,
    textInverse: palette.white,
    
    // Status colors
    success: palette.green.default,
    warning: palette.orange.default,
    error: palette.red.default,
    info: palette.blue.default,
    
    // Button colors
    button: palette.blue.default,
    buttonDisabled: palette.grey.medium,
    buttonText: palette.white,
    
    // Balance colors
    positive: palette.green.default,
    negative: palette.red.default,
    neutral: palette.grey.darker,
    
    // Avatar colors
    avatarColors: [
      palette.blue.default,
      palette.green.default,
      palette.red.default,
      palette.purple.default,
      palette.orange.default,
      palette.turquoise.default,
      palette.blue.dark,
      palette.black,
    ],
    
    // Dividers and borders
    border: palette.grey.light,
    divider: palette.grey.light,
    
    // Component specific
    searchBackground: palette.grey.lighter,
    highlightBackground: '#FFF9E0',
    highlightBorder: '#F1E6B2',
    
    // Gradients - Defined as arrays for LinearGradient
    gradients: {
      primary: [palette.black, '#4CA1AF'],
      success: [palette.green.dark, palette.green.light],
      warning: [palette.orange.dark, palette.orange.light],
      danger: [palette.red.dark, palette.red.light],
    },
    
    // States
    active: palette.blue.default,
    inactive: palette.grey.medium,
    selected: palette.blue.light,
    
    // Palette export for custom use cases
    palette,
  };
  
  export default colors;