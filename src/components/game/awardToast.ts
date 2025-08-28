export function awardToast(awarded: { item_slug: string; qty: number }[]|undefined) {
  if (!awarded?.length) return;
  alert('You earned: ' + awarded.map(a => `${a.item_slug}×${a.qty}`).join(', '));
}
