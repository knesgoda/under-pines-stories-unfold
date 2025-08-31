export const REACTIONS = [
  { emoji: '👍', type: 'thumbs_up', label: 'Thumbs up' },
  { emoji: '😂', type: 'laugh', label: 'Laugh' },
  { emoji: '😡', type: 'angry', label: 'Angry' },
  { emoji: '😢', type: 'sad', label: 'Sad' },
  { emoji: '🤬', type: 'rage', label: 'Rage' },
  { emoji: '🙄', type: 'eyeroll', label: 'Eye roll' },
] as const

export type ReactionType = typeof REACTIONS[number]['type']

export const emojiToType = REACTIONS.reduce((acc, r) => {
  acc[r.emoji] = r.type
  return acc
}, {} as Record<string, ReactionType>)

export const typeToEmoji = REACTIONS.reduce((acc, r) => {
  acc[r.type] = r.emoji
  return acc
}, {} as Record<ReactionType, string>)
