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
      console.log('Comment count feature is currently disabled - database schema does not include comment_count column')
      
      toast({
        title: "Feature Disabled",
        description: "Comment count functionality is not currently available",
        variant: "destructive"
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
