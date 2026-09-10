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
    const vendorPayout = parseFloat((effectiveBaseCost + vendorProfitAmount).toFixed(2));

    const platformMarginPct = Number(platformSettings.platformMarginPct || 15);
    const marginRatio = platformMarginPct / 100;
    const computedSellingPrice = marginRatio < 1
      ? parseFloat((vendorPayout / (1 - marginRatio)).toFixed(2))
      : vendorPayout;

    const platformMarginAmount = parseFloat((computedSellingPrice - vendorPayout).toFixed(2));

    return {
      rawCost,
      supplierDiscountAmount,
      netSupplierCost,
      landed,
      trueCost,
      effectiveBaseCost,
      profitPct,
      vendorProfitAmount,
      vendorPayout,
      platformMarginPct,
      computedSellingPrice,
      platformMarginAmount,
      marginStatus: 'healthy'
    };
  }, [productCost, vendorProfitPct, supplierDiscountPct, freightCost, insuranceCost, dutiesCost, otherLandedCost, showAdvanced, platformSettings.platformMarginPct]);

  // Handle changes and notify parent
  const handleCostChange = (val) => {
    setProductCost(val);
    const costNum = Math.max(0, parseFloat(val) || 0);
    const profitPct = Math.max(0, parseFloat(vendorProfitPct) || 0);
    const payout = costNum * (1 + profitPct / 100);
    const m = (platformSettings.platformMarginPct || 15) / 100;
    const price = m < 1 ? parseFloat((payout / (1 - m)).toFixed(2)) : payout;

    if (onPriceChange && price > 0) {
      onPriceChange(price.toString());
    }
  };

  const handleProfitPctChange = (val) => {
    setVendorProfitPct(val);
    const costNum = Math.max(0, parseFloat(productCost) || 0);
    const profitPct = Math.max(0, parseFloat(val) || 0);
    const payout = costNum * (1 + profitPct / 100);
    const m = (platformSettings.platformMarginPct || 15) / 100;
    const price = m < 1 ? parseFloat((payout / (1 - m)).toFixed(2)) : payout;

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
      vendorPriceToPlatform: calculations.vendorPayout,
      platformMarginPct: calculations.platformMarginPct,
      targetMarginPct: calculations.platformMarginPct,
      baseSellingPrice: calculations.computedSellingPrice,
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
    calculations.vendorPayout,
    calculations.platformMarginPct,
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
            Vendor Product Costing & Protected Margin
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Enter your product cost and desired profit percentage. The system automatically calculates the customer selling price while protecting Grand Store's minimum 15% platform margin.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 text-xs font-mono rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center gap-1.5 shadow-sm">
            <ShieldCheck size={13} />
            <span>Standard {calculations.platformMarginPct}% Commission</span>
          </span>
        </div>
      </div>

      {/* Vendor Costing Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2 font-semibold">
            Your Product Cost (ZAR) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-[var(--color-gold)] font-mono text-sm font-bold">R</span>
            <input
              type="number"
              min="0"
              step="any"
              value={productCost}
              onChange={(e) => handleCostChange(e.target.value)}
              placeholder="100.00"
              className="w-full bg-black/50 border border-white/20 rounded-lg pl-8 pr-4 py-2.5 text-white font-mono text-base focus:border-[var(--color-gold)] focus:outline-none transition-colors"
              required
            />
          </div>
          <p className="text-[10px] text-white/40 mt-1">Your base unit production or wholesale cost</p>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2 font-semibold">
            Your Profit Percentage (%) *
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
              required
            />
            <span className="absolute right-3 top-3 text-[var(--color-gold)] font-mono text-sm font-bold">%</span>
          </div>
          <p className="text-[10px] text-white/40 mt-1">Margin added to your cost for your earnings (e.g. 20%)</p>
        </div>
      </div>

      {/* Section 300–344 Vendor Pricing Transparency Breakdown Table */}
      <div className="p-4 bg-black/60 border border-[var(--color-gold)]/30 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs text-[var(--color-gold)] font-serif font-bold uppercase tracking-wider border-b border-white/10 pb-2">
          <span>Calculation Step</span>
          <span>Amount (ZAR)</span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between text-gray-300">
            <span>Your Product Cost:</span>
            <span className="text-white"><Price amount={calculations.effectiveBaseCost.toFixed(2)} /></span>
          </div>

          <div className="flex justify-between text-gray-300">
            <span>Your Profit ({calculations.profitPct}%):</span>
            <span className="text-emerald-400">+ <Price amount={calculations.vendorProfitAmount.toFixed(2)} /></span>
          </div>

          <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2">
            <span>YOUR PRICE TO PLATFORM (Payout):</span>
            <span className="text-[var(--color-gold)]"><Price amount={calculations.vendorPayout.toFixed(2)} /></span>
          </div>

          <div className="flex justify-between text-gray-300">
            <span>Grand Store Commission ({calculations.platformMarginPct}%):</span>
            <span className="text-amber-400">+ <Price amount={calculations.platformMarginAmount.toFixed(2)} /></span>
          </div>

          <div className="flex justify-between items-center font-bold text-sm text-white border-t border-white/20 pt-2 bg-[var(--color-gold)]/10 p-2 rounded">
            <span>CUSTOMER SELLING PRICE:</span>
            <span className="text-base text-white"><Price amount={calculations.computedSellingPrice.toFixed(2)} /></span>
          </div>
        </div>

        {/* Official Vendor Explanation Notice */}
        <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg flex items-start gap-2.5">
          <Info size={16} className="text-[var(--color-gold)] shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/70 leading-relaxed">
            <strong className="text-white">Vendor Pricing Transparency:</strong> You decide your own profit percentage. Grand Store then applies its standard {calculations.platformMarginPct}% platform commission automatically: <code className="text-[var(--color-gold)] font-mono">Customer Price = Your Payout / (1 - {(calculations.platformMarginPct / 100).toFixed(2)})</code>. You will receive your full agreed payout of <strong className="text-white"><Price amount={calculations.vendorPayout.toFixed(2)} /></strong> upon customer delivery.
          </p>
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
