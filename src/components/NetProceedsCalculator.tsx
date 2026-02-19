/**
 * Net Proceeds Calculator
 * Shows estimated profit/loss after fees for each selling platform
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NetProceedsCalculatorProps {
  marketPrice: number;
  purchasePrice: number;
  quantity?: number;
}

interface PlatformResult {
  platform: string;
  feePercent: number;
  feeLabel: string;
  extraFees: number;
  extraLabel?: string;
  netPerCard: number;
  profitPerCard: number;
  totalProfit: number;
}

function calculatePlatform(
  price: number,
  costBasis: number,
  qty: number,
  feePercent: number,
  extraFees: number
): { netPerCard: number; profitPerCard: number; totalProfit: number } {
  const fees = price * (feePercent / 100) + extraFees;
  const netPerCard = Math.round((price - fees) * 100) / 100;
  const profitPerCard = Math.round((netPerCard - costBasis) * 100) / 100;
  const totalProfit = Math.round(profitPerCard * qty * 100) / 100;
  return { netPerCard, profitPerCard, totalProfit };
}

export const NetProceedsCalculator = ({
  marketPrice,
  purchasePrice,
  quantity = 1,
}: NetProceedsCalculatorProps) => {
  if (!marketPrice || marketPrice <= 0) return null;

  const platforms: PlatformResult[] = [
    {
      platform: 'eBay',
      feePercent: 13.25,
      feeLabel: '13.25% fee',
      extraFees: 1.0,
      extraLabel: '+ $1 shipping',
      ...calculatePlatform(marketPrice, purchasePrice, quantity, 13.25, 1.0),
    },
    {
      platform: 'TCGPlayer',
      feePercent: 10.25,
      feeLabel: '10.25% fee',
      extraFees: 0,
      ...calculatePlatform(marketPrice, purchasePrice, quantity, 10.25, 0),
    },
    {
      platform: 'Local / Cash',
      feePercent: 0,
      feeLabel: 'No fees',
      extraFees: 0,
      ...calculatePlatform(marketPrice, purchasePrice, quantity, 0, 0),
    },
  ];

  const formatDollar = (n: number) =>
    `${n >= 0 ? '' : '-'}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="p-4 rounded-2xl bg-secondary/30 border border-border/20">
      <h4 className="font-semibold text-sm text-muted-foreground mb-3">
        If you sell this card:
      </h4>
      <div className="space-y-2.5">
        {platforms.map((p) => {
          const isProfit = p.profitPerCard > 0;
          const isBreakEven = p.profitPerCard === 0;
          return (
            <div
              key={p.platform}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card/50"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{p.platform}</p>
                <p className="text-[10px] text-muted-foreground/60">
                  {p.feeLabel}{p.extraLabel ? ` ${p.extraLabel}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatDollar(p.netPerCard)}
                </p>
                <div className="flex items-center justify-end gap-1">
                  {isBreakEven ? (
                    <Minus className="w-2.5 h-2.5 text-muted-foreground" />
                  ) : isProfit ? (
                    <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5 text-red-500" />
                  )}
                  <span
                    className={`text-[10px] font-bold ${
                      isBreakEven
                        ? 'text-muted-foreground'
                        : isProfit
                        ? 'text-emerald-500'
                        : 'text-red-500'
                    }`}
                  >
                    {isProfit ? '+' : ''}{formatDollar(p.profitPerCard)} profit
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
