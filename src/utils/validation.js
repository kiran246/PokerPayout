/**
 * Validation Utility Module
 * 
 * This module provides functions for validating various inputs and data
 * throughout the Poker Settlement App.
 */

/**
 * Validates a player name
 * 
 * @param {string} name - The player name to validate
 * @param {Array} existingPlayers - Array of existing player objects
 * @param {string} currentPlayerId - ID of the current player (for edit validations)
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validatePlayerName = (name, existingPlayers = [], currentPlayerId = null) => {
    // Trim the name to remove whitespace
    const trimmedName = name ? name.trim() : '';
    
    // Check if name is empty
    if (!trimmedName) {
      return {
        isValid: false,
        message: 'Player name cannot be empty'
      };
    }
    
    // Check if name is too short
    if (trimmedName.length < 2) {
      return {
        isValid: false,
        message: 'Player name must be at least 2 characters'
      };
    }
    
    // Check if name is too long
    if (trimmedName.length > 30) {
      return {
        isValid: false,
        message: 'Player name cannot exceed 30 characters'
      };
    }
    
    // Check for duplicate player names
    const nameExists = existingPlayers.some(player => 
      player.name.toLowerCase() === trimmedName.toLowerCase() && 
      player.id !== currentPlayerId
    );
    
    if (nameExists) {
      return {
        isValid: false,
        message: 'A player with this name already exists'
      };
    }
    
    // If all validations pass
    return {
      isValid: true,
      message: ''
    };
  };
  
  /**
   * Validates a player balance input
   * 
   * @param {string|number} balance - The balance input to validate
   * @returns {Object} - { isValid: boolean, message: string, formattedValue: number|string }
   */
  export const validateBalance = (balance) => {
    // Special case for empty or dash inputs (user is typing)
    if (balance === '' || balance === '-') {
      return {
        isValid: true,
        message: '',
        formattedValue: balance
      };
    }
    
    // Convert to number and check if it's a valid number
    const numValue = parseFloat(balance);
    
    if (isNaN(numValue)) {
      return {
        isValid: false,
        message: 'Please enter a valid number',
        formattedValue: 0
      };
    }
    
    // Limit decimal places to 2
    const formattedValue = Math.round(numValue * 100) / 100;
    
    return {
      isValid: true,
      message: '',
      formattedValue
    };
  };
  
  /**
   * Validates an entire set of player balances
   * 
   * @param {Object} balances - Object with player IDs as keys and balances as values
   * @returns {Object} - { isValid: boolean, message: string, totalBalance: number }
   */
  export const validateBalances = (balances) => {
    // Convert all values to numbers, filtering out invalid inputs
    const numericBalances = Object.entries(balances)
      .filter(([_, value]) => value !== '' && value !== '-')
      .map(([_, value]) => parseFloat(value) || 0);
    
    // Calculate sum of all balances
    const totalBalance = numericBalances.reduce((sum, value) => sum + value, 0);
    const roundedTotal = Math.round(totalBalance * 100) / 100; // Round to 2 decimal places
    
    // Check if balances sum to zero (with small tolerance for floating point errors)
    if (Math.abs(roundedTotal) > 0.01) {
      return {
        isValid: false,
        message: `Balances must sum to zero (current sum: ${roundedTotal.toFixed(2)})`,
        totalBalance: roundedTotal
      };
    }
    
    // Check if we have at least 2 non-zero balances
    const nonZeroCount = numericBalances.filter(value => Math.abs(value) > 0.01).length;
    
    if (nonZeroCount < 2) {
      return {
        isValid: false,
        message: 'At least 2 players must have non-zero balances',
        totalBalance: roundedTotal
      };
    }
    
    return {
      isValid: true,
      message: '',
      totalBalance: roundedTotal
    };
  };
  
  /**
   * Validates a session object
   * 
   * @param {Object} session - Session object to validate
   * @returns {Object} - { isValid: boolean, message: string }
   */
  export const validateSession = (session) => {
    // Check if session exists
    if (!session) {
      return {
        isValid: false,
        message: 'Invalid session data'
      };
    }
    
    // Check if session has required properties
    if (!session.id || !session.date || !session.balances) {
      return {
        isValid: false,
        message: 'Session is missing required data'
      };
    }
    
    // Validate balances
    const balanceValidation = validateBalances(session.balances);
    if (!balanceValidation.isValid) {
      return balanceValidation;
    }
    
    return {
      isValid: true,
      message: ''
    };
  };
  
  /**
   * Formats a currency value
   * 
   * @param {number} value - The value to format
   * @param {boolean} showSign - Whether to show + sign for positive values
   * @returns {string} - Formatted currency string
   */
  export const formatCurrency = (value, showSign = false) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '$0.00';
    }
    
    const numValue = parseFloat(value);
    const isPositive = numValue > 0;
    const sign = isPositive && showSign ? '+' : '';
    
    return `${sign}$${Math.abs(numValue).toFixed(2)}`;
  };
  
  /**
   * Validates email address
   * 
   * @param {string} email - Email address to validate
   * @returns {Object} - { isValid: boolean, message: string }
   */
  export const validateEmail = (email) => {
    if (!email || !email.trim()) {
      return {
        isValid: false,
        message: 'Email cannot be empty'
      };
    }
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        message: 'Please enter a valid email address'
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  };
  
  /**
   * Validates password strength
   * 
   * @param {string} password - Password to validate
   * @returns {Object} - { isValid: boolean, message: string, strength: string }
   */
  export const validatePassword = (password) => {
    if (!password) {
      return {
        isValid: false,
        message: 'Password cannot be empty',
        strength: 'weak'
      };
    }
    
    // Check password length
    if (password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long',
        strength: 'weak'
      };
    }
    
    // Calculate password strength
    let strength = 'medium';
    let strengthMessage = '';
    
    // Has uppercase letters
    const hasUppercase = /[A-Z]/.test(password);
    // Has lowercase letters
    const hasLowercase = /[a-z]/.test(password);
    // Has numbers
    const hasNumbers = /\d/.test(password);
    // Has special characters
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let strengthChecks = 0;
    if (hasUppercase) strengthChecks++;
    if (hasLowercase) strengthChecks++;
    if (hasNumbers) strengthChecks++;
    if (hasSpecial) strengthChecks++;
    
    if (password.length >= 12 && strengthChecks >= 3) {
      strength = 'strong';
      strengthMessage = 'Strong password';
    } else if (password.length >= 8 && strengthChecks >= 2) {
      strength = 'medium';
      strengthMessage = 'Medium strength password';
    } else {
      strength = 'weak';
      strengthMessage = 'Weak password. Consider adding uppercase letters, numbers, or special characters';
    }
    
    return {
      isValid: true,
      message: strengthMessage,
      strength
    };
  };
  
  export default {
    validatePlayerName,
    validateBalance,
    validateBalances,
    validateSession,
    formatCurrency,
    validateEmail,
    validatePassword
  };