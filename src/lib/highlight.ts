export interface HighlightMatch {
  before: string
  match: string
  after: string
  hasMatch: boolean
}

export function getHighlightMatch(text: string, query: string): HighlightMatch {
  if (!query || !text) {
    return { before: text, match: '', after: '', hasMatch: false }
  }
  
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) {
    return { before: text, match: '', after: '', hasMatch: false }
  }
  
  return {
    before: text.slice(0, index),
    match: text.slice(index, index + query.length),
    after: text.slice(index + query.length),
    hasMatch: true
  }
}