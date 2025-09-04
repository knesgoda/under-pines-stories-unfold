// Script to add comment_count column and populate it
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co' // Replace with your actual URL
const supabaseKey = 'your-anon-key' // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey)

async function addCommentCount() {
  try {
    console.log('Adding comment_count column...')
    
    // Add the column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comment_count int DEFAULT 0;'
    })
    
    if (alterError) {
      console.error('Error adding column:', alterError)
      return
    }
    
    console.log('Column added successfully!')
    
    // Populate comment counts
    console.log('Populating comment counts...')
    
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id')
    
    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return
    }
    
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
        console.log(`Updated post ${post.id} with ${count || 0} comments`)
      }
    }
    
    console.log('Comment counts populated successfully!')
    
  } catch (error) {
    console.error('Script error:', error)
  }
}

addCommentCount()
