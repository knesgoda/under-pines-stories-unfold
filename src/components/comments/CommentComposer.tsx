import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  onSubmit: (body: string) => Promise<void>
  placeholder?: string
  autoFocus?: boolean
}

export function CommentComposer({ onSubmit, placeholder = 'Write a comment...', autoFocus }: Props) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const remaining = 1000 - body.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    try {
      setLoading(true)
      await onSubmit(body)
      setBody('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        maxLength={1000}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={loading}
      />
      <div className="flex justify-between text-sm text-muted-foreground items-center">
        <span>{remaining}</span>
        <Button type="submit" disabled={loading || !body.trim()}>Submit</Button>
      </div>
    </form>
  )
}
