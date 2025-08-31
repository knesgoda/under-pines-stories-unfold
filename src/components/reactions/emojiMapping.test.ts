import test from 'node:test'
import assert from 'node:assert/strict'
import { emojiToType, typeToEmoji } from './reactionTypes.ts'

test('emoji to reaction type mapping', () => {
  assert.equal(emojiToType['👍'], 'thumbs_up')
  assert.equal(typeToEmoji['laugh'], '😂')
})
