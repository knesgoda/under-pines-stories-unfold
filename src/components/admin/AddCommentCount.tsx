import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export function AddCommentCount() {
  const [isRunning, setIsRunning] = useState(false)

  const addCommentCountColumn = async () => {
    setIsRunning(true)
    try {
      // First, try to add the column (this might fail if it already exists, which is fine)
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comment_count int DEFAULT 0;'
      })
      
      if (alterError && !alterError.message.includes('already exists')) {
        console.error('Error adding column:', alterError)
        toast({
          title: "Error",
          description: "Failed to add comment_count column",
          variant: "destructive"
        })
        return
      }
      
      console.log('Column added or already exists')
      
      // Now populate the comment counts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id')
      
      if (postsError) {
        console.error('Error fetching posts:', postsError)
        toast({
          title: "Error",
          description: "Failed to fetch posts",
          variant: "destructive"
        })
        return
      }
      
      let updatedCount = 0
      for (const post of posts) {
        const { count, error: countError } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('is_deleted', false)
        
        if (countError) {
          console.error(`Error counting comments for post ${post.id}:`, countError)
          continue
        }
        
        const { error: updateError } = await supabase
          .from('posts')
          .update({ comment_count: count || 0 })
          .eq('id', post.id)
        
        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError)
        } else {
          updatedCount++
        }
      }
      
      toast({
        title: "Success",
        description: `Updated comment counts for ${updatedCount} posts`
      })
      
    } catch (error) {
      console.error('Script error:', error)
      toast({
        title: "Error",
        description: "Failed to add comment counts",
        variant: "destructive"
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Add Comment Count</CardTitle>
        <CardDescription>
          Add comment_count column to posts table and populate existing data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={addCommentCountColumn} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running...' : 'Add Comment Count Column'}
        </Button>
      </CardContent>
    </Card>
  )
}
