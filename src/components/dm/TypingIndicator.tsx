interface TypingIndicatorProps {
  isTyping: boolean
  username?: string
}

export function TypingIndicator({ isTyping, username }: TypingIndicatorProps) {
  if (!isTyping) return null
  return (
    <div className="px-4 py-2 text-sm text-muted-foreground">
      {username ? `${username} is typing...` : 'Typing...'}
    </div>
  )
}
