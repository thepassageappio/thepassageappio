export function money(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return '$' + amount.toFixed(amount % 1 === 0 ? 0 : 2);
}

export function calculateVendorEconomics({ value, marketplaceFeePercent, funeralHomeSharePercent, hasFuneralHome }) {
  const finalValue = Number(value || 0);
  if (!Number.isFinite(finalValue) || finalValue <= 0) {
    return {
      platformFeeAmount: null,
      funeralHomeShareAmount: null,
      passageShareAmount: null,
    };
  }
  const feePercent = Number(marketplaceFeePercent ?? 18);
  const homePercent = hasFuneralHome ? Number(funeralHomeSharePercent ?? 6) : 0;
  const platformFeeAmount = roundMoney(finalValue * feePercent / 100);
  const funeralHomeShareAmount = roundMoney(finalValue * Math.min(homePercent, feePercent) / 100);
  const passageShareAmount = roundMoney(Math.max(platformFeeAmount - funeralHomeShareAmount, 0));
  return { platformFeeAmount, funeralHomeShareAmount, passageShareAmount };
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
