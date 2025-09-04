import { getHighlightMatch } from '@/lib/highlight'

interface HighlightedTextProps {
  text: string
  query: string
  className?: string
}

export function HighlightedText({ text, query, className = '' }: HighlightedTextProps) {
  const match = getHighlightMatch(text, query)
  
  if (!match.hasMatch) {
    return <span className={className}>{text}</span>
  }
  
  return (
    <span className={className}>
      {match.before}
      <mark className="bg-accent-warm/20">
        {match.match}
      </mark>
      {match.after}
    </span>
  )
}