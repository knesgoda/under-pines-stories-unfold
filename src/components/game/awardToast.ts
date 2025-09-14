export function awardToast(awarded: { item_slug: string; qty: number }[]|undefined) {
  if (!awarded?.length) return;
  
  // Get item details for better display
  const itemNames: { [key: string]: string } = {
    'chocolate': '🍫 Chocolate',
    'graham_crackers': '🍪 Graham Crackers', 
    'marshmallows': '🤍 Marshmallows',
    'hot_dog_buns': '🥖 Hot Dog Buns',
    'ketchup': '🍅 Ketchup',
    'mustard': '💛 Mustard',
    'relish': '🥒 Relish',
    'stick': '🪵 Roasting Stick',
    'fire': '🔥 Fire'
  };
  
  const items = awarded.map(a => `${itemNames[a.item_slug] || a.item_slug}×${a.qty}`).join(', ');
  
  // Create a toast notification instead of alert
  import('@/hooks/use-toast').then(({ toast }) => {
    toast({
      title: "🎁 Ingredients earned!",
      description: items,
      duration: 4000
    });
  });
}
