'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CommentThread } from './CommentThread'

interface CommentModalProps {
  open: boolean
  onClose: () => void
  postId: string
}

export function CommentModal({ open, onClose, postId }: CommentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <CommentThread postId={postId} />
        </div>
      </DialogContent>
    </Dialog>
  )
}