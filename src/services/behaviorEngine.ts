import { Transaction, IdentityData, SecurityInsight, AppNotification, RiskLevel } from '../store/useAppStore';

export const behaviorEngine = {
  evaluateTransaction(tx: Transaction, profile: IdentityData | null): SecurityInsight {
    let threatLevel: RiskLevel = 'low';
    let insightMessage = 'Transaction appears routine. Standard verification active.';
    let recommendedAction = 'Standard Verification';

    if (!profile) return { threatLevel, insightMessage, recommendedAction };

    // Unusual transaction size logic
    const amount = parseFloat(tx.fee); // Mock size
    if (amount > 0.05) {
      threatLevel = 'medium';
      insightMessage = 'Unusual transaction fee detected for this profile.';
      recommendedAction = 'Enhanced Verification Required';
    }

    // High-risk type frequency (Simulated check)
    if (tx.riskLevel === 'high') {
      threatLevel = 'high';
      insightMessage = 'Transaction interacts with a high-risk address or smart contract.';
      recommendedAction = 'Secure Multi-Factor Authentication';
    }

    // New permission granted (Simulated check)
    if (profile.permissions.includes('admin') || tx.type === 'APPROVAL') {
      threatLevel = 'medium';
      insightMessage = 'Identity layer change detected. Review session permissions.';
      recommendedAction = 'Verify Identity Layer Change';
    }

    return { threatLevel, insightMessage, recommendedAction };
  },

  analyzeSessionActivity(notifications: AppNotification[]): SecurityInsight {
    const recentHighRisk = notifications.filter(n => n.priority >= 2).length;

    if (recentHighRisk > 2) {
      return {
        threatLevel: 'high',
        insightMessage: 'Multiple high-risk anomalies detected in the last session.',
        recommendedAction: 'Restrict All Permissions'
      };
    } else if (recentHighRisk > 0) {
      return {
        threatLevel: 'medium',
        insightMessage: 'Occasional security alerts detected. Routine monitoring recommended.',
        recommendedAction: 'Security Audit'
      };
    }

    return {
      threatLevel: 'low',
      insightMessage: 'Session activity is consistent with historical behavior.',
      recommendedAction: 'View Report'
    };
  },

  generateSecurityInsight(profile: IdentityData | null): SecurityInsight {
    if (!profile) return { threatLevel: 'low', insightMessage: 'Waiting for wallet sync...', recommendedAction: 'Sync Wallet' };

    if (profile.riskScore > 50) {
      return {
        threatLevel: 'medium',
        insightMessage: 'Trust score below 50. Increase identity verification.',
        recommendedAction: 'Improve Identity Score'
      };
    }

    return {
      threatLevel: 'low',
      insightMessage: 'All systems nominal. Your identity layer is secured.',
      recommendedAction: 'Security Settings'
    };
  }
};
