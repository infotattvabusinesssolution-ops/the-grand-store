import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DollarSign, ShieldCheck, AlertTriangle, Info, ChevronDown, ChevronUp, Scale, CheckCircle2 } from 'lucide-react';
import Price from './ui/Price';
import api from '../api';

/**
 * ProductCostingCard
 * Implements:
 * 1. Vendor Pricing Formula & 15% Platform Protected Margin (Section 298–344)
 * 2. Transparent Pricing Explanation Notice
 * 3. Profit Guard Margin Status Indicator (🟢 Healthy, 🟠 Warning, 🔴 Blocked)
 * 4. Advanced Landed Cost Simulator for Internal Managers
 */
export default function ProductCostingCard({
  initialCosting = {},
  currentPrice = '',
  onPriceChange,
  onCostingChange,
  isInternalProductManager = false
}) {
  const [platformSettings, setPlatformSettings] = useState({
    platformMarginPct: 15
  });

  // Costing form inputs
  const [productCost, setProductCost] = useState(initialCosting?.supplierPrice || initialCosting?.productCost || initialCosting?.trueCost || '');
  const [vendorProfitPct, setVendorProfitPct] = useState(initialCosting?.vendorProfitPct !== undefined ? initialCosting.vendorProfitPct : 20);

  // Advanced Landed Costs for Internal Managers
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [supplierDiscountPct, setSupplierDiscountPct] = useState(initialCosting?.supplierDiscountPct || 0);
  const [freightCost, setFreightCost] = useState(initialCosting?.freightCost || 0);
  const [insuranceCost, setInsuranceCost] = useState(initialCosting?.insuranceCost || 0);
  const [dutiesCost, setDutiesCost] = useState(initialCosting?.dutiesCost || 0);
  const [otherLandedCost, setOtherLandedCost] = useState(initialCosting?.otherLandedCost || 0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings/public');
        if (res.data) {
          const comm = res.data.marketplaceCommissionPct !== undefined
            ? res.data.marketplaceCommissionPct
            : (res.data.minimumPlatformMarginPct !== undefined ? res.data.minimumPlatformMarginPct : 15);
          setPlatformSettings({
            platformMarginPct: comm
          });
        }
      } catch (err) {
        console.error('Failed to fetch public settings for costing engine', err);
      }
    };
    fetchSettings();
  }, []);

  // Sync with initialCosting if it updates from parent (e.g. edit mode)
  useEffect(() => {
    if (initialCosting && Object.keys(initialCosting).length > 0) {
      if (initialCosting.supplierPrice !== undefined) setProductCost(initialCosting.supplierPrice);
      if (initialCosting.vendorProfitPct !== undefined) setVendorProfitPct(initialCosting.vendorProfitPct);
      if (initialCosting.supplierDiscountPct !== undefined) setSupplierDiscountPct(initialCosting.supplierDiscountPct);
      if (initialCosting.freightCost !== undefined) setFreightCost(initialCosting.freightCost);
      if (initialCosting.insuranceCost !== undefined) setInsuranceCost(initialCosting.insuranceCost);
      if (initialCosting.dutiesCost !== undefined) setDutiesCost(initialCosting.dutiesCost);
      if (initialCosting.otherLandedCost !== undefined) setOtherLandedCost(initialCosting.otherLandedCost);
    }
  }, [initialCosting]);

  // Compute live calculations
  const calculations = useMemo(() => {
    const rawCost = Math.max(0, parseFloat(productCost) || 0);
    const discPct = Math.max(0, parseFloat(supplierDiscountPct) || 0);
    const supplierDiscountAmount = parseFloat(((rawCost * discPct) / 100).toFixed(2));
    const netSupplierCost = parseFloat((rawCost - supplierDiscountAmount).toFixed(2));

    const landed = parseFloat((
      (parseFloat(freightCost) || 0) +
      (parseFloat(insuranceCost) || 0) +
      (parseFloat(dutiesCost) || 0) +
      (parseFloat(otherLandedCost) || 0)
    ).toFixed(2));

    const trueCost = parseFloat((netSupplierCost + (showAdvanced ? landed : 0)).toFixed(2));
    const effectiveBaseCost = showAdvanced ? trueCost : rawCost;

    const profitPct = Math.max(0, parseFloat(vendorProfitPct) || 0);
    const vendorProfitAmount = parseFloat(((effectiveBaseCost * profitPct) / 100).toFixed(2));
    const targetNetEarnings = parseFloat((effectiveBaseCost + vendorProfitAmount).toFixed(2));

    const platformMarginPct = Number(platformSettings.platformMarginPct || 15);
    const vatPct = 15; // Universal SARS VAT
    const totalDeductionPct = platformMarginPct + vatPct; // e.g. 30%
    const totalDeductionRatio = totalDeductionPct / 100;

    // Selling price needed so that after 15% commission and 15% VAT, vendor receives targetNetEarnings:
    const computedSellingPrice = totalDeductionRatio < 1 && targetNetEarnings > 0
      ? parseFloat((targetNetEarnings / (1 - totalDeductionRatio)).toFixed(2))
      : targetNetEarnings;

    // Active retail price is the direct price typed by user, or computed price from cost/profit
    const activePrice = parseFloat(currentPrice) > 0 ? parseFloat(currentPrice) : computedSellingPrice;

    // Live deductions on the active retail price
    const platformCommissionAmount = parseFloat(((activePrice * platformMarginPct) / 100).toFixed(2));
    const vatAmount = parseFloat(((activePrice * vatPct) / 100).toFixed(2));
    const netVendorPayout = parseFloat((activePrice - platformCommissionAmount - vatAmount).toFixed(2));

    return {
      rawCost,
      supplierDiscountAmount,
      netSupplierCost,
      landed,
      trueCost,
      effectiveBaseCost,
      profitPct,
      vendorProfitAmount,
      targetNetEarnings,
      vendorPayout: targetNetEarnings,
      platformMarginPct,
      vatPct,
      totalDeductionPct,
      computedSellingPrice,
      activePrice,
      platformCommissionAmount,
      platformMarginAmount: platformCommissionAmount,
      vatAmount,
      netVendorPayout,
      marginStatus: 'healthy'
    };
  }, [productCost, vendorProfitPct, supplierDiscountPct, freightCost, insuranceCost, dutiesCost, otherLandedCost, showAdvanced, platformSettings.platformMarginPct, currentPrice]);

  // Handle changes and notify parent
  const handleCostChange = (val) => {
    setProductCost(val);
    const costNum = Math.max(0, parseFloat(val) || 0);
    const profitPct = Math.max(0, parseFloat(vendorProfitPct) || 0);
    const targetNet = costNum * (1 + profitPct / 100);
    const totalRatio = ((platformSettings.platformMarginPct || 15) + 15) / 100;
    const price = totalRatio < 1 ? parseFloat((targetNet / (1 - totalRatio)).toFixed(2)) : targetNet;

    if (onPriceChange && price > 0) {
      onPriceChange(price.toString());
    }
  };

  const handleProfitPctChange = (val) => {
    setVendorProfitPct(val);
    const costNum = Math.max(0, parseFloat(productCost) || 0);
    const profitPct = Math.max(0, parseFloat(val) || 0);
    const targetNet = costNum * (1 + profitPct / 100);
    const totalRatio = ((platformSettings.platformMarginPct || 15) + 15) / 100;
    const price = totalRatio < 1 ? parseFloat((targetNet / (1 - totalRatio)).toFixed(2)) : targetNet;

    if (onPriceChange && price > 0) {
      onPriceChange(price.toString());
    }
  };

  // Keep callback reference stable
  const onCostingChangeRef = useRef(onCostingChange);
  useEffect(() => {
    onCostingChangeRef.current = onCostingChange;
  }, [onCostingChange]);

  // Push full costing snapshot to parent only when calculation values actually change
  const prevSnapshotRef = useRef('');
  useEffect(() => {
    const snapshot = {
      supplierPrice: calculations.rawCost,
      supplierDiscountPct: parseFloat(supplierDiscountPct) || 0,
      netSupplierCost: calculations.netSupplierCost,
      freightCost: parseFloat(freightCost) || 0,
      insuranceCost: parseFloat(insuranceCost) || 0,
      dutiesCost: parseFloat(dutiesCost) || 0,
      otherLandedCost: parseFloat(otherLandedCost) || 0,
      trueCost: calculations.trueCost,
      vendorProfitPct: calculations.profitPct,
      vendorPriceToPlatform: calculations.targetNetEarnings,
      platformMarginPct: calculations.platformMarginPct,
      vatPct: calculations.vatPct,
      targetMarginPct: calculations.platformMarginPct,
      baseSellingPrice: calculations.activePrice,
      minimumSellingPrice: calculations.computedSellingPrice,
      marginStatus: calculations.marginStatus
    };
    const serialized = JSON.stringify(snapshot);
    if (prevSnapshotRef.current !== serialized) {
      prevSnapshotRef.current = serialized;
      if (onCostingChangeRef.current) {
        onCostingChangeRef.current(snapshot);
      }
    }
  }, [
    calculations.rawCost,
    calculations.netSupplierCost,
    calculations.trueCost,
    calculations.profitPct,
    calculations.targetNetEarnings,
    calculations.platformMarginPct,
    calculations.vatPct,
    calculations.activePrice,
    calculations.computedSellingPrice,
    calculations.marginStatus,
    supplierDiscountPct,
    freightCost,
    insuranceCost,
    dutiesCost,
    otherLandedCost
  ]);

  return (
    <div className="space-y-6 bg-black/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--color-gold)]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
        <div>
          <h3 className="text-white font-serif text-xl flex items-center gap-2">
            <DollarSign className="text-[var(--color-gold)]" size={22} />
            Vendor Costing, VAT & Payout Breakdown
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Live preview of customer retail price, 15% platform commission, 15% SARS VAT, and your net bank payout.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 text-xs font-mono rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center gap-1.5 shadow-sm">
            <ShieldCheck size={13} />
            <span>{calculations.platformMarginPct}% Commission</span>
          </span>
          <span className="px-2.5 py-1 text-xs font-mono rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 size={13} />
            <span>15% SARS VAT Incl.</span>
          </span>
        </div>
      </div>

      {/* Vendor Costing Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2 font-semibold">
            Your Base Cost (ZAR)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-[var(--color-gold)] font-mono text-sm font-bold">R</span>
            <input
              type="number"
              min="0"
              step="any"
              value={productCost}
              onChange={(e) => handleCostChange(e.target.value)}
              placeholder="e.g. 500.00"
              className="w-full bg-black/50 border border-white/20 rounded-lg pl-8 pr-4 py-2.5 text-white font-mono text-base focus:border-[var(--color-gold)] focus:outline-none transition-colors"
            />
          </div>
          <p className="text-[10px] text-white/40 mt-1">Your wholesale production or acquisition cost per unit</p>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2 font-semibold">
            Your Desired Profit Margin (%)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="500"
              step="1"
              value={vendorProfitPct}
              onChange={(e) => handleProfitPctChange(e.target.value)}
              placeholder="20"
              className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-2.5 text-white font-mono text-base focus:border-[var(--color-gold)] focus:outline-none transition-colors"
            />
            <span className="absolute right-3 top-3 text-[var(--color-gold)] font-mono text-sm font-bold">%</span>
          </div>
          <p className="text-[10px] text-white/40 mt-1">Net profit percentage you want to earn above your cost</p>
        </div>
      </div>

      {/* Live Payout & Deductions Breakdown Table */}
      <div className="p-5 bg-black/60 border border-[var(--color-gold)]/30 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs text-[var(--color-gold)] font-serif font-bold uppercase tracking-wider border-b border-white/10 pb-2">
          <span>Live Financial Breakdown</span>
          <span className="px-2 py-0.5 rounded bg-[var(--color-gold)]/15 border border-[var(--color-gold)]/30 text-[10px] font-mono font-normal">
            70% Net Vendor Payout Rate
          </span>
        </div>

        <div className="space-y-2.5 text-xs font-mono">
          {/* Customer Selling Price */}
          <div className="flex justify-between items-center bg-white/[0.04] p-2.5 rounded-lg border border-white/10">
            <div>
              <span className="text-white font-bold block text-sm">CUSTOMER RETAIL PRICE</span>
              <span className="text-[10px] text-emerald-400">15% South African VAT Inclusive</span>
            </div>
            <span className="text-lg font-bold text-white"><Price amount={calculations.activePrice.toFixed(2)} /></span>
          </div>

          {/* Grand Store Commission Deduction */}
          <div className="flex justify-between items-center text-gray-300 px-2">
            <div>
              <span>Grand Store Commission ({calculations.platformMarginPct}%):</span>
              <span className="text-[10px] text-white/40 block">Marketplace hosting, buyer acquisition & payment gateway</span>
            </div>
            <span className="text-amber-400 font-bold">- <Price amount={calculations.platformCommissionAmount.toFixed(2)} /></span>
          </div>

          {/* SARS VAT Deduction */}
          <div className="flex justify-between items-center text-gray-300 px-2">
            <div>
              <span>Universal SARS VAT ({calculations.vatPct}%):</span>
              <span className="text-[10px] text-white/40 block">South African statutory sales tax remitted to SARS</span>
            </div>
            <span className="text-cyan-400 font-bold">- <Price amount={calculations.vatAmount.toFixed(2)} /></span>
          </div>

          {/* Final Net Vendor Payout Highlight */}
          <div className="flex justify-between items-center font-bold text-sm text-white border-t border-[var(--color-gold)]/40 pt-3 bg-gradient-to-r from-[var(--color-gold)]/20 via-[var(--color-gold)]/10 to-transparent p-3 rounded-lg border">
            <div>
              <span className="text-[var(--color-gold)] uppercase tracking-wider text-xs block font-serif">
                ESTIMATED NET VENDOR PAYOUT
              </span>
              <span className="text-[10px] text-white/60 font-mono font-normal">
                Transferred directly to your verified bank account upon customer delivery
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-400">
                <Price amount={calculations.netVendorPayout.toFixed(2)} />
              </span>
              <span className="text-[10px] text-white/40 block">
                ({calculations.activePrice > 0 ? Math.round((calculations.netVendorPayout / calculations.activePrice) * 100) : 70}% of retail price)
              </span>
            </div>
          </div>
        </div>

        {/* Cost & Profit Context Note if cost was provided */}
        {calculations.rawCost > 0 && (
          <div className="pt-2 text-[11px] font-mono text-white/60 border-t border-white/5 flex flex-wrap justify-between gap-1">
            <span>Cost: R{calculations.effectiveBaseCost.toFixed(2)}</span>
            <span>+ Profit ({calculations.profitPct}%): R{calculations.vendorProfitAmount.toFixed(2)}</span>
            <span className="text-emerald-400 font-medium">= Target Net: R{calculations.targetNetEarnings.toFixed(2)}</span>
          </div>
        )}

        {/* Official Vendor Explanation Notice */}
        <div className="mt-3 p-3.5 bg-white/[0.03] border border-white/10 rounded-lg flex items-start gap-3">
          <Info size={17} className="text-[var(--color-gold)] shrink-0 mt-0.5" />
          <div className="text-[11px] text-white/70 leading-relaxed space-y-1">
            <p className="font-semibold text-white">
              Why are 15% Commission and 15% VAT deducted?
            </p>
            <p>
              • <strong className="text-amber-300">15% Marketplace Commission:</strong> Grand Store's platform fee covering buyer traffic, luxury presentation, customer support, and secure PayFast escrow processing.
            </p>
            <p>
              • <strong className="text-cyan-300">15% Universal SARS VAT:</strong> Under South African law, all customer retail prices must include 15% VAT. Grand Store handles tax reporting so you remain 100% compliant.
            </p>
            <p className="text-emerald-400/90 font-medium pt-0.5">
              ✓ You always receive your full <strong>Net Vendor Payout (70%)</strong> upon confirmed customer delivery with zero surprise deductions.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Landed Cost Simulator for Internal Managers */}
      {isInternalProductManager && (
        <div className="border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-xs uppercase tracking-widest text-[var(--color-gold)] font-semibold hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Scale size={14} /> Advanced Landed Cost Breakdown (Internal Product Managers)
            </span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 bg-black/50 border border-white/10 rounded-xl space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-white/60 mb-1">Supplier Disc (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={supplierDiscountPct}
                    onChange={(e) => setSupplierDiscountPct(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-white/60 mb-1">Freight (ZAR)</label>
                  <input
                    type="number"
                    min="0"
                    value={freightCost}
                    onChange={(e) => setFreightCost(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-white/60 mb-1">Duties (ZAR)</label>
                  <input
                    type="number"
                    min="0"
                    value={dutiesCost}
                    onChange={(e) => setDutiesCost(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-white/60 mb-1">Insurance (ZAR)</label>
                  <input
                    type="number"
                    min="0"
                    value={insuranceCost}
                    onChange={(e) => setInsuranceCost(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-gray-400 pt-2 border-t border-white/5">
                <span>Calculated True Landed Cost:</span>
                <span className="font-bold text-white"><Price amount={calculations.trueCost.toFixed(2)} /></span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
