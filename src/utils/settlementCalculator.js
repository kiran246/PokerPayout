/**
 * Poker Settlement Calculator Module
 * 
 * This module provides functions for calculating optimal settlement transactions
 * between players after a poker game. The goal is to minimize the number of 
 * transactions needed to settle all debts.
 */

/**
 * Calculates the minimum number of transactions needed to settle balances
 * 
 * @param {Object} balances - Object with player IDs as keys and their balance as values
 * @returns {Array} - Array of settlement transactions { from, to, amount }
 */
export const calculateOptimalSettlements = (balances) => {
  // Convert balances to array of {id, amount} pairs
  const balanceArray = Object.entries(balances).map(([id, amount]) => ({ 
    id, 
    amount: parseFloat(amount) || 0 
  }));
  
  // Skip players with zero balance
  const activeBalances = balanceArray.filter(player => Math.abs(player.amount) > 0.01);
  
  // If there are no non-zero balances, return empty array
  if (activeBalances.length === 0) {
    return [];
  }
  
  // Verify that balances sum to zero (within floating point tolerance)
  if (!verifyBalances(balances)) {
    console.warn('Settlement calculation: Balances do not sum to zero');
    // Proceed anyway - the calling function should handle this validation
  }
  
  // Separate players who need to pay (negative balance) and receive (positive balance)
  const debtors = activeBalances.filter(player => player.amount < 0)
    .sort((a, b) => a.amount - b.amount); // Sort by amount (ascending/most negative first)
  
  const creditors = activeBalances.filter(player => player.amount > 0)
    .sort((a, b) => b.amount - a.amount); // Sort by amount (descending/highest positive first)
  
  const settlements = [];
  
  // Keep processing until all debts are settled
  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];
    
    // Calculate how much can be settled in this transaction
    const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
    
    // Round the amount to 2 decimal places to avoid floating point errors
    const roundedAmount = Math.round(amount * 100) / 100;
    
    // Add the settlement transaction
    settlements.push({
      from: debtor.id,
      to: creditor.id,
      amount: roundedAmount
    });
    
    // Update balances
    debtor.amount = Math.round((debtor.amount + roundedAmount) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - roundedAmount) * 100) / 100;
    
    // Remove players with zero balance (using a small tolerance for floating point errors)
    if (Math.abs(debtor.amount) < 0.01) debtors.shift();
    if (Math.abs(creditor.amount) < 0.01) creditors.shift();
  }
  
  return settlements;
};

/**
 * Verifies that the total balance sums to zero (or very close to zero due to floating point precision)
 * 
 * @param {Object} balances - Object with player IDs as keys and their balance as values
 * @returns {boolean} - Whether the balances are valid
 */
export const verifyBalances = (balances) => {
  const sum = Object.values(balances)
    .filter(value => !isNaN(parseFloat(value)))
    .reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  
  return Math.abs(sum) < 0.01; // Allow for small floating point errors
};

/**
 * Suggest balanced adjustments for a set of player balances that don't sum to zero
 * 
 * @param {Object} balances - Object with player IDs as keys and their balance as values
 * @returns {Object} - Object with suggested adjusted balances
 */
export const suggestBalancedAdjustments = (balances) => {
  // Convert to numbers and filter out empty values
  const validBalances = {};
  let activePlayerCount = 0;
  
  Object.entries(balances).forEach(([id, value]) => {
    if (value !== '' && value !== '-' && !isNaN(parseFloat(value))) {
      validBalances[id] = parseFloat(value);
      activePlayerCount++;
    } else {
      validBalances[id] = 0;
    }
  });
  
  // If no valid balances, return original
  if (activePlayerCount === 0) {
    return balances;
  }
  
  // Calculate current sum
  const sum = Object.values(validBalances).reduce((acc, val) => acc + val, 0);
  
  // If sum is already very close to zero, no adjustment needed
  if (Math.abs(sum) < 0.01) {
    return balances;
  }
  
  // Calculate correction per player
  const correction = sum / activePlayerCount;
  
  // Create adjusted balances
  const adjustedBalances = {};
  
  Object.entries(validBalances).forEach(([id, value]) => {
    if (value !== 0) {
      // Only adjust non-zero values, round to 2 decimal places
      adjustedBalances[id] = Math.round((value - correction) * 100) / 100;
    } else {
      adjustedBalances[id] = value;
    }
  });
  
  return adjustedBalances;
};

/**
 * Calculate total amount being settled
 * 
 * @param {Array} settlements - Array of settlement transactions
 * @returns {number} - Total amount being transferred
 */
export const calculateTotalSettlementAmount = (settlements) => {
  return settlements.reduce((total, settlement) => total + settlement.amount, 0);
};

/**
 * Get stats about winners and losers
 * 
 * @param {Object} balances - Object with player IDs as keys and their balance as values
 * @returns {Object} - Stats object
 */
export const getBalanceStats = (balances) => {
  let winners = 0;
  let losers = 0;
  let biggestWinnerId = null;
  let biggestWinnerAmount = 0;
  let biggestLoserId = null;
  let biggestLoserAmount = 0;
  
  Object.entries(balances).forEach(([id, amount]) => {
    // Convert to number
    const numAmount = parseFloat(amount) || 0;
    
    if (numAmount > 0) {
      winners++;
      if (numAmount > biggestWinnerAmount) {
        biggestWinnerAmount = numAmount;
        biggestWinnerId = id;
      }
    } else if (numAmount < 0) {
      losers++;
      if (numAmount < biggestLoserAmount) {
        biggestLoserAmount = numAmount;
        biggestLoserId = id;
      }
    }
  });
  
  return {
    winners,
    losers,
    biggestWinner: biggestWinnerId ? { id: biggestWinnerId, amount: biggestWinnerAmount } : null,
    biggestLoser: biggestLoserId ? { id: biggestLoserId, amount: biggestLoserAmount } : null
  };
};

/**
 * Validates if a set of balances is ready for settlement calculation
 * 
 * @param {Object} balances - Object with player IDs as keys and their balance as values
 * @returns {Object} - { isValid: boolean, reason: string }
 */
export const validateBalancesForSettlement = (balances) => {
  // Check if we have at least 2 players with non-zero balances
  const nonZeroPlayers = Object.values(balances)
    .filter(value => typeof value === 'number' && Math.abs(value) > 0.01)
    .length;
  
  if (nonZeroPlayers < 2) {
    return { 
      isValid: false, 
      reason: 'Need at least 2 players with non-zero balances' 
    };
  }
  
  // Check if balances sum to zero
  if (!verifyBalances(balances)) {
    return { 
      isValid: false, 
      reason: 'Balances must sum to zero' 
    };
  }
  
  return { isValid: true };
};

export default {
  calculateOptimalSettlements,
  verifyBalances,
  suggestBalancedAdjustments,
  calculateTotalSettlementAmount,
  getBalanceStats,
  validateBalancesForSettlement
};