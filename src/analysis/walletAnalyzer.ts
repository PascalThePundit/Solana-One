import { Wallet, WalletActivity } from '../store/identityStore';

export interface AnalysisResult {
  identityScore: number;
  activityType: string;
  riskLevel: 'Low' | 'Moderate' | 'High';
  summary: string;
  tags: string[];
}

export const analyzeWalletIntelligence = (
  wallets: Wallet[],
  recentActivity: WalletActivity[],
  handle: string | null = null
): AnalysisResult => {
  // 1. Identity Score Calculation
  // Higher activity + diversity = higher score
  const txCount = recentActivity.length;
  const walletCount = wallets.length;
  
  // Diversity: unique wallets involved in transactions (mocked logic based on walletId in activity)
  const activeWallets = new Set(recentActivity.map(a => a.walletId)).size;
  
  // Base score from transaction count (up to 60 points)
  const activityScore = Math.min(txCount * 5, 60);
  // Diversity score from wallet count and active usage (up to 40 points)
  const diversityScore = Math.min((walletCount * 10) + (activeWallets * 10), 40);
  
  let identityScore = activityScore + diversityScore;

  // Handle boost
  if (handle) {
    identityScore = Math.min(identityScore + 10, 100);
  }

  // 2. Risk Level Calculation
  // - If many rapid transactions → High (Mock: more than 10 transactions)
  // - If most transactions are outgoing → Moderate (Mock: activity status 'approved' is common, let's assume 'approved' reflects standard outbound/inbound)
  // - If few transactions → Low
  
  let riskLevel: 'Low' | 'Moderate' | 'High' = 'Low';
  if (txCount > 10) {
    riskLevel = 'High';
  } else if (txCount > 3) {
    riskLevel = 'Moderate';
  } else {
    riskLevel = 'Low';
  }

  // 3. Activity Type Classification
  let activityType = 'Dormant';
  if (txCount === 0) {
    activityType = 'Dormant';
  } else {
    // Mock heuristics
    const titles = recentActivity.map(a => a.title.toLowerCase());
    const isDeFi = titles.some(t => t.includes('swap') || t.includes('liquidity') || t.includes('stake'));
    const isNFT = titles.some(t => t.includes('nft') || t.includes('mint'));
    
    if (isDeFi) activityType = 'DeFi-heavy';
    else if (isNFT) activityType = 'NFT-active';
    else activityType = 'Transfer-focused';
  }

  // 4. Summary Generation
  const riskDesc = riskLevel === 'Low' ? 'low risk' : riskLevel === 'Moderate' ? 'moderate activity' : 'high-frequency patterns';
  const activityDesc = activityType === 'Dormant' ? 'limited recent movement' : `consistent ${activityType.toLowerCase()}`;
  
  const summary = `This identity shows ${riskDesc} with ${activityDesc} across ${activeWallets || 'no'} active wallets.`;

  // 5. Tags
  const tags = [activityType];
  if (handle) tags.push('Named Identity');
  if (identityScore > 80) tags.push('Verified Path');
  if (riskLevel === 'Low') tags.push('Secure');
  if (txCount > 5) tags.push('Active Seeker');
  if (walletCount > 1) tags.push('Multi-Wallet');

  return {
    identityScore,
    activityType,
    riskLevel,
    summary,
    tags
  };
};
