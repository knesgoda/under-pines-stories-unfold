-- Drop problematic conversation_participants policies
DROP POLICY IF EXISTS "Users can add themselves to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;

-- Create simple conversation_participants policies without recursion
CREATE POLICY "Users can view their own participation" ON conversation_participants
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can join conversations" ON conversation_participants
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Drop problematic group_members policies  
DROP POLICY IF EXISTS "Group members are viewable by group members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

-- Create simple group_members policies without recursion
CREATE POLICY "Users can view their own membership" ON group_members
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can join groups simple" ON group_members
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups simple" ON group_members
FOR DELETE 
USING (user_id = auth.uid());