import React, { useState } from 'react';
import { 
  Award, 
  Sparkles, 
  Gift, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  Check, 
  Zap, 
  TrendingUp, 
  Clock, 
  ShoppingBag, 
  RefreshCw, 
  Share2, 
  Crown,
  ChevronRight,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToastNotification } from '../../context/ToastNotificationContext';
import { LoyaltyReward } from '../../types';

export const REWARDS_CATALOG: LoyaltyReward[] = [
  {
    id: 'rew-50-off',
    name: '₹50 Off Instant Voucher',
    code: 'KHATU50',
    pointsRequired: 200,
    discountValue: 50,
    description: 'Flat ₹50 discount on any purchase above ₹299 across clothes, utilities, or dairy.',
    badge: 'Bronze Reward'
  },
  {
    id: 'rew-150-off',
    name: '₹150 Off Mega Voucher + Free Paneer',
    code: 'KHATU150',
    pointsRequired: 500,
    discountValue: 150,
    description: 'Flat ₹150 discount on any order above ₹799 or complimentary 500g Fresh Malai Paneer.',
    badge: 'Silver Milestone'
  },
  {
    id: 'rew-350-off',
    name: '₹350 Off Hamper Voucher',
    code: 'KHATU350',
    pointsRequired: 1000,
    discountValue: 350,
    description: 'Save ₹350 on handloom clothes, copperware sets, or 1 Litre Vedic Bilona Ghee orders.',
    badge: 'Gold Patron'
  },
  {
    id: 'rew-750-off',
    name: '₹750 Off VIP Privilege Pass',
    code: 'KHATU750',
    pointsRequired: 1500,
    discountValue: 750,
    description: 'Exclusive ₹750 festive privilege voucher + priority 6:00 AM delivery across Bhopal.',
    badge: 'Diamond Devotee'
  }
];

export const KhatuPointsRewards: React.FC = () => {
  const { khatuPoints, pointsHistory, addKhatuPoints, redeemReward, claimedCodes } = useAuth();
  const { showCustomToast } = useToastNotification();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Identify current tier
  const getTier = (points: number) => {
    if (points >= 1500) return { name: 'Diamond Devotee', color: 'from-cyan-600 to-blue-700', badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: '💎' };
    if (points >= 1000) return { name: 'Gold Gaushala Patron', color: 'from-amber-500 to-yellow-600', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300', icon: '👑' };
    if (points >= 200) return { name: 'Silver Seva Tier', color: 'from-stone-400 to-slate-600', badgeColor: 'bg-slate-100 text-slate-800 border-slate-300', icon: '🥈' };
    return { name: 'Bronze Devotee', color: 'from-amber-700 to-orange-800', badgeColor: 'bg-orange-100 text-orange-900 border-orange-300', icon: '🥉' };
  };

  const currentTier = getTier(khatuPoints);

  // Find next reward target
  const nextReward = REWARDS_CATALOG.find((r) => r.pointsRequired > khatuPoints) || REWARDS_CATALOG[REWARDS_CATALOG.length - 1];
  const previousMilestonePoints = REWARDS_CATALOG.filter(r => r.pointsRequired <= khatuPoints).slice(-1)[0]?.pointsRequired || 0;
  
  // Progress calculation
  const pointsRange = nextReward.pointsRequired - previousMilestonePoints;
  const pointsEarnedInRange = Math.max(0, khatuPoints - previousMilestonePoints);
  const progressPercent = Math.min(100, Math.max(10, Math.round((pointsEarnedInRange / (pointsRange || 1)) * 100)));
  const pointsNeeded = Math.max(0, nextReward.pointsRequired - khatuPoints);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showCustomToast({
      orderId: 'LOYALTY-POINTS',
      newStatus: 'delivered',
      title: 'Discount Code Copied! 🎟️',
      message: `Promo code "${code}" copied to clipboard. Apply at checkout to save!`,
      duration: 5000
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRedeem = (reward: LoyaltyReward) => {
    setRedeemingId(reward.id);
    const success = redeemReward(reward);
    if (success) {
      showCustomToast({
        orderId: 'REWARD-CLAIM',
        newStatus: 'delivered',
        title: 'Reward Unlocked! 🎉',
        message: `Successfully claimed ${reward.name}! Use code ${reward.code} at checkout.`,
        duration: 6000
      });
    }
    setRedeemingId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* ========================================================================= */}
      {/* 1. HERO REWARD WALLET CARD                                                */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1B4332] via-[#245A43] to-[#122E22] text-white p-6 sm:p-7 shadow-xl border border-[#2D6A4F]">
        
        {/* Decorative background motifs */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 rounded-full bg-[#D97706]/15 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-44 h-44 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentTier.badgeColor} uppercase tracking-wider`}>
                <span>{currentTier.icon}</span>
                <span>{currentTier.name}</span>
              </span>
              <span className="text-xs text-[#E8E5DF] opacity-80">· Bhopal Member Privileges</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#FDE68A]">
                {khatuPoints}
              </span>
              <span className="text-base sm:text-lg font-medium text-[#E8E5DF]">
                Khatu Points
              </span>
            </div>

            <p className="text-xs text-[#E8E5DF] max-w-md leading-relaxed">
              Earn <strong>1 Khatu Point for every ₹10 spent</strong> on handloom clothes, copperware, daily groceries, and farm-fresh dairy.
            </p>
          </div>

          {/* Quick Simulation / Test Buttons for Demonstration */}
          <div className="bg-black/25 backdrop-blur-md border border-white/15 p-4 rounded-xl space-y-2 self-start md:self-auto shrink-0">
            <div className="text-[10px] font-bold text-[#FDE68A] uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#D97706]" />
              <span>Simulate Live Point Earnings:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addKhatuPoints(50, 'Purchase Reward (₹500 spent on Groceries & Apparel)')}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer border border-white/10"
                title="Simulate placing a ₹500 purchase"
              >
                +50 Pts (Shop ₹500)
              </button>
              
              <button
                type="button"
                onClick={() => addKhatuPoints(20, 'Bhopal Glass Milk Bottle Return (2 Bottles credited)')}
                className="px-2.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                title="Simulate returning 2 empty glass bottles"
              >
                +20 Pts (Bottle Return)
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC PROGRESS BAR TO NEXT DISCOUNT REWARD                            */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E8E5DF] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        
        {/* Milestone Headline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E5DF] pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B4332] uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-[#D97706]" />
              <span>Next Discount Milestone</span>
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1C1917] mt-0.5">
              {nextReward.name} ({nextReward.pointsRequired} Pts)
            </h3>
          </div>

          <div className="text-right sm:self-center">
            {pointsNeeded > 0 ? (
              <span className="inline-block bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-xs font-bold px-3 py-1 rounded-full">
                {pointsNeeded} points needed to unlock
              </span>
            ) : (
              <span className="inline-block bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                Target Achieved! Claim below ✓
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar Graphic */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs font-bold text-[#78716C]">
            <span>Current: {khatuPoints} Pts</span>
            <span className="text-[#1B4332]">Target: {nextReward.pointsRequired} Pts</span>
          </div>

          {/* Animated Bar Track */}
          <div className="relative w-full h-4 bg-[#E8E5DF]/60 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#D97706] transition-all duration-700 ease-out relative"
              style={{ width: `${Math.min(100, Math.round((khatuPoints / nextReward.pointsRequired) * 100))}%` }}
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#78716C] pt-1">
            <span>Spend ₹{pointsNeeded * 10} on any products to reach {nextReward.pointsRequired} Pts</span>
            <span className="font-mono font-bold text-[#1B4332]">
              {Math.min(100, Math.round((khatuPoints / nextReward.pointsRequired) * 100))}% Completed
            </span>
          </div>
        </div>

        {/* Visual Milestones Road Track */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#E8E5DF] text-center">
          {REWARDS_CATALOG.map((rew) => {
            const isUnlocked = khatuPoints >= rew.pointsRequired;
            const isTarget = nextReward.id === rew.id;

            return (
              <div 
                key={rew.id} 
                className={`p-2.5 rounded-xl border transition-all ${
                  isUnlocked 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                    : isTarget
                    ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309] shadow-xs ring-1 ring-[#D97706]/30'
                    : 'bg-[#FBF9F5] border-[#E8E5DF] text-[#78716C] opacity-75'
                }`}
              >
                <div className="font-mono text-xs font-bold">
                  {rew.pointsRequired} Pts
                </div>
                <div className="text-[11px] font-semibold truncate mt-0.5">
                  ₹{rew.discountValue} OFF
                </div>
                <div className="text-[10px] mt-1">
                  {isUnlocked ? (
                    <span className="text-emerald-700 font-bold flex items-center justify-center gap-0.5">
                      <Check className="w-3 h-3" /> Unlocked
                    </span>
                  ) : isTarget ? (
                    <span className="text-[#D97706] font-bold">Target</span>
                  ) : (
                    <span>Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. REWARDS CATALOG & PROMO CODE CLAIM CARDS                               */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-[#1B4332] flex items-center gap-2">
            <Gift className="w-4 h-4 text-[#D97706]" />
            <span>Discount Rewards & Vouchers</span>
          </h3>
          <span className="text-xs text-[#78716C]">
            Apply code at cart / checkout
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REWARDS_CATALOG.map((reward) => {
            const isUnlocked = khatuPoints >= reward.pointsRequired;
            const isClaimed = claimedCodes.includes(reward.code);

            return (
              <div
                key={reward.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isUnlocked
                    ? 'bg-white border-[#2D6A4F] shadow-xs hover:shadow-md'
                    : 'bg-[#FBF9F5] border-[#E8E5DF] opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FBF9F5] border border-[#E8E5DF] text-[#78716C]">
                      {reward.badge}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#1B4332]">
                      {reward.pointsRequired} Pts
                    </span>
                  </div>

                  <h4 className="font-serif text-base font-bold text-[#1C1917]">
                    {reward.name}
                  </h4>
                  <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
                    {reward.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E8E5DF] flex items-center justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-[#1B4332] bg-[#FBF9F5] px-2.5 py-1 rounded border border-[#E8E5DF]">
                    {reward.code}
                  </div>

                  {isUnlocked ? (
                    <button
                      onClick={() => handleCopyCode(reward.code)}
                      className="px-3 py-1.5 bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedCode === reward.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#FDE68A]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#FDE68A]" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#78716C]">
                      Need {reward.pointsRequired - khatuPoints} more pts
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. HOW CUSTOMERS EARN KHATU POINTS                                        */}
      {/* ========================================================================= */}
      <div className="bg-[#FBF9F5] border border-[#E8E5DF] rounded-2xl p-5 space-y-3">
        <h3 className="font-serif text-base font-bold text-[#1B4332] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D97706]" />
          <span>Ways to Earn More Khatu Points</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white border border-[#E8E5DF] rounded-xl flex items-start gap-3">
            <ShoppingBag className="w-5 h-5 text-[#1B4332] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1C1917] block">Shop Clothes, Utilities & Dairy</span>
              <span className="text-[#78716C] text-[11px]">
                Earn 1 Khatu point for every ₹10 spent on all purchases automatically.
              </span>
            </div>
          </div>

          <div className="p-3 bg-white border border-[#E8E5DF] rounded-xl flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1C1917] block">Bhopal Glass Milk Bottle Return</span>
              <span className="text-[#78716C] text-[11px]">
                Hand empty sanitized bottles to our delivery driver to earn +10 pts per bottle.
              </span>
            </div>
          </div>

          <div className="p-3 bg-white border border-[#E8E5DF] rounded-xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#1B4332] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1C1917] block">Daily Milk Monthly Pass</span>
              <span className="text-[#78716C] text-[11px]">
                Subscribe for 30 days of morning A2 milk delivery to earn +50 bonus loyalty points.
              </span>
            </div>
          </div>

          <div className="p-3 bg-white border border-[#E8E5DF] rounded-xl flex items-start gap-3">
            <Share2 className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#1C1917] block">Refer a Neighbor in Bhopal</span>
              <span className="text-[#78716C] text-[11px]">
                Share your family code to receive +150 points when a neighbor makes their first order.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. POINTS TRANSACTION HISTORY LEDGER                                      */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <h3 className="font-serif text-base font-bold text-[#1B4332] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#78716C]" />
          <span>Khatu Points History & Activity Log</span>
        </h3>

        <div className="bg-white border border-[#E8E5DF] rounded-xl divide-y divide-[#E8E5DF] overflow-hidden">
          {pointsHistory.map((tx) => (
            <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-[#1C1917]">
                  {tx.description}
                </p>
                <p className="text-[11px] text-[#78716C]">
                  {tx.date} {tx.orderId && `· Ref: #${tx.orderId.toUpperCase()}`}
                </p>
              </div>

              <div className="shrink-0 font-mono font-bold text-xs">
                {tx.points >= 0 ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    +{tx.points} Pts
                  </span>
                ) : (
                  <span className="text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    {tx.points} Pts
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
