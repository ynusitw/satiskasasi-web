// Saatlik kampanyanın bir birime düşen indirimi. API'deki CampaignRules.UnitDiscount
// ve kasadaki CampaignService ile aynı kural: menüde görünen fiyat, siparişte
// sunucunun hesapladığıyla tutmalı.
export function unitDiscount(campaign, unitPrice) {
  if (!campaign || !(unitPrice > 0) || !(campaign.discountValue > 0)) return 0
  if (campaign.discountType === 'Amount') return Math.min(campaign.discountValue, unitPrice)
  const pct = Math.min(Math.max(campaign.discountValue, 0), 100)
  return Math.round(unitPrice * pct) / 100
}

export const discountedPrice = (campaign, unitPrice) => unitPrice - unitDiscount(campaign, unitPrice)
