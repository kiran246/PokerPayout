/**
 * Analytics Utility Module for Poker Settlement App
 * 
 * Provides functions for analyzing player performance and session history
 */

/**
 * Calculates overall stats for a player
 * 
 * @param {string} playerId - The player's ID
 * @param {Array} history - Array of session history objects
 * @returns {Object} - Player statistics
 */
export const calculatePlayerStats = (playerId, history) => {
    // Filter sessions where this player participated
    const playerSessions = history.filter(session => 
      session.balances && session.balances[playerId] !== undefined
    );
    
    if (playerSessions.length === 0) {
      return {
        totalSessions: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        biggestWin: 0,
        biggestLoss: 0,
        totalWinnings: 0,
        avgWinnings: 0,
        netWinnings: 0,
        winStreak: 0,
        currentStreak: 0,
        lastSessionBalance: null,
        lastSessionDate: null
      };
    }
    
    // Calculate stats by iterating through sessions
    let winCount = 0;
    let lossCount = 0;
    let totalWinnings = 0;  // Sum of wins only
    let netWinnings = 0;    // Net balance (wins - losses)
    let biggestWin = 0;
    let biggestLoss = 0;
    let currentStreak = 0;
    let maxStreak = 0;
    let streakType = null; // 'win' or 'loss'
    
    playerSessions.forEach(session => {
      const balance = parseFloat(session.balances[playerId]) || 0;
      
      if (balance > 0) {
        winCount++;
        totalWinnings += balance;
        netWinnings += balance;
        
        if (balance > biggestWin) {
          biggestWin = balance;
        }
        
        // Update streak
        if (streakType === 'win') {
          currentStreak++;
        } else {
          currentStreak = 1;
          streakType = 'win';
        }
      } 
      else if (balance < 0) {
        lossCount++;
        netWinnings += balance; // Add negative value
        
        if (balance < biggestLoss) {
          biggestLoss = balance;
        }
        
        // Update streak
        if (streakType === 'loss') {
          currentStreak++;
        } else {
          currentStreak = 1;
          streakType = 'loss';
        }
      }
      // If balance is exactly 0, don't affect streaks
      
      // Update max streak
      if (streakType === 'win' && currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    });
    
    // Sort sessions by date to get latest session
    const sortedSessions = [...playerSessions].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    const lastSession = sortedSessions[0];
    const lastSessionBalance = parseFloat(lastSession.balances[playerId]) || 0;
    const lastSessionDate = new Date(lastSession.date);
    
    // Calculate win rate and average winnings
    const winRate = playerSessions.length > 0 ? (winCount / playerSessions.length) * 100 : 0;
    const avgWinnings = winCount > 0 ? totalWinnings / winCount : 0;
    
    return {
      totalSessions: playerSessions.length,
      winCount,
      lossCount,
      winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
      biggestWin,
      biggestLoss,
      totalWinnings,
      avgWinnings,
      netWinnings,
      winStreak: maxStreak,
      currentStreak: streakType === 'win' ? currentStreak : -currentStreak, // Negative for loss streak
      lastSessionBalance,
      lastSessionDate
    };
  };
  
  /**
   * Gets an array of players ranked by net winnings
   * 
   * @param {Array} players - Array of player objects
   * @param {Array} history - Array of session history objects
   * @returns {Array} - Players sorted by net winnings (highest first)
   */
  export const getPlayerRankings = (players, history) => {
    return players.map(player => {
      const stats = calculatePlayerStats(player.id, history);
      return {
        ...player,
        stats
      };
    }).sort((a, b) => b.stats.netWinnings - a.stats.netWinnings);
  };
  
  /**
   * Calculates monthly performance for a player
   * 
   * @param {string} playerId - The player's ID
   * @param {Array} history - Array of session history objects
   * @returns {Array} - Monthly performance data
   */
  export const getMonthlyPerformance = (playerId, history) => {
    const monthlyData = {};
    
    // Filter sessions where this player participated
    const playerSessions = history.filter(session => 
      session.balances && session.balances[playerId] !== undefined
    );
    
    playerSessions.forEach(session => {
      const date = new Date(session.date);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const balance = parseFloat(session.balances[playerId]) || 0;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          monthName: date.toLocaleString('default', { month: 'short' }),
          netWinnings: 0,
          sessions: 0,
          wins: 0,
          losses: 0
        };
      }
      
      monthlyData[monthYear].netWinnings += balance;
      monthlyData[monthYear].sessions += 1;
      
      if (balance > 0) {
        monthlyData[monthYear].wins += 1;
      } else if (balance < 0) {
        monthlyData[monthYear].losses += 1;
      }
    });
    
    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => {
      if (a.year === b.year) {
        return a.month - b.month;
      }
      return a.year - b.year;
    });
  };
  
  /**
   * Calculate head-to-head stats between two players
   * 
   * @param {string} player1Id - First player's ID
   * @param {string} player2Id - Second player's ID
   * @param {Array} history - Array of session history objects
   * @returns {Object} - Head-to-head statistics
   */
  export const getHeadToHeadStats = (player1Id, player2Id, history) => {
    // Filter sessions where both players participated
    const sharedSessions = history.filter(session => 
      session.balances && 
      session.balances[player1Id] !== undefined &&
      session.balances[player2Id] !== undefined
    );
    
    if (sharedSessions.length === 0) {
      return {
        sharedSessions: 0,
        player1Wins: 0,
        player2Wins: 0,
        draws: 0
      };
    }
    
    let player1Wins = 0;
    let player2Wins = 0;
    let draws = 0;
    
    sharedSessions.forEach(session => {
      const balance1 = parseFloat(session.balances[player1Id]) || 0;
      const balance2 = parseFloat(session.balances[player2Id]) || 0;
      
      if (balance1 > balance2) {
        player1Wins++;
      } else if (balance2 > balance1) {
        player2Wins++;
      } else {
        draws++;
      }
    });
    
    return {
      sharedSessions: sharedSessions.length,
      player1Wins,
      player2Wins,
      draws
    };
  };
  
  /**
   * Calculate session statistics
   * 
   * @param {Array} history - Array of session history objects
   * @param {Array} players - Array of player objects
   * @returns {Object} - Session statistics
   */
  export const getSessionStats = (history, players) => {
    if (history.length === 0) {
      return {
        totalSessions: 0,
        averagePlayersPerSession: 0,
        averageTransactionsPerSession: 0,
        avgSettlementAmount: 0,
        topPlayers: []
      };
    }
    
    let totalPlayers = 0;
    let totalTransactions = 0;
    let totalSettlementAmount = 0;
    
    history.forEach(session => {
      const playerCount = session.balances ? Object.keys(session.balances).length : 0;
      totalPlayers += playerCount;
      
      const transactionCount = session.settlements ? session.settlements.length : 0;
      totalTransactions += transactionCount;
      
      if (session.settlements) {
        session.settlements.forEach(settlement => {
          totalSettlementAmount += settlement.amount;
        });
      }
    });
    
    // Get top players by appearances
    const playerAppearances = {};
    
    history.forEach(session => {
      if (session.balances) {
        Object.keys(session.balances).forEach(playerId => {
          playerAppearances[playerId] = (playerAppearances[playerId] || 0) + 1;
        });
      }
    });
    
    const topPlayers = Object.entries(playerAppearances)
      .map(([playerId, appearances]) => {
        const player = players.find(p => p.id === playerId);
        return {
          id: playerId,
          name: player ? player.name : 'Unknown Player',
          appearances,
          attendanceRate: (appearances / history.length) * 100
        };
      })
      .sort((a, b) => b.appearances - a.appearances)
      .slice(0, 5);
    
    return {
      totalSessions: history.length,
      averagePlayersPerSession: history.length > 0 ? totalPlayers / history.length : 0,
      averageTransactionsPerSession: history.length > 0 ? totalTransactions / history.length : 0,
      avgSettlementAmount: totalTransactions > 0 ? totalSettlementAmount / totalTransactions : 0,
      topPlayers
    };
  };
  
  /**
   * Get array of data points for a player's performance over time
   * 
   * @param {string} playerId - The player's ID
   * @param {Array} history - Array of session history objects
   * @returns {Array} - Data points for a performance chart
   */
  export const getPlayerPerformanceData = (playerId, history) => {
    // Filter sessions where this player participated
    const playerSessions = history.filter(session => 
      session.balances && session.balances[playerId] !== undefined
    );
    
    // Sort by date
    const sortedSessions = [...playerSessions].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
    
    let cumulativeBalance = 0;
    
    return sortedSessions.map(session => {
      const date = new Date(session.date);
      const balance = parseFloat(session.balances[playerId]) || 0;
      cumulativeBalance += balance;
      
      return {
        date,
        sessionBalance: balance,
        cumulativeBalance
      };
    });
  };
  
  export default {
    calculatePlayerStats,
    getPlayerRankings,
    getMonthlyPerformance,
    getHeadToHeadStats,
    getSessionStats,
    getPlayerPerformanceData
  };