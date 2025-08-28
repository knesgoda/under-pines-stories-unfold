export function highlight(text: string, query: string): string {
  if (!query || !text) return text
  
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return text
  
  return `${text.slice(0, index)}<mark class="bg-accent-warm/20">${text.slice(index, index + query.length)}</mark>${text.slice(index + query.length)}`
}