-- Fix infinite recursion in conversation_participants policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations they're invited to" ON conversation_participants;

-- Create simpler policies without recursion
CREATE POLICY "Users can view their own participation" ON conversation_participants
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can join conversations" ON conversation_participants
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Fix infinite recursion in group_members policies  
DROP POLICY IF EXISTS "Users can view groups they belong to" ON group_members;
DROP POLICY IF EXISTS "Users can join groups they're invited to" ON group_members;

-- Create simpler policies without recursion
CREATE POLICY "Users can view their own membership" ON group_members
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can join groups" ON group_members
FOR INSERT 
WITH CHECK (user_id = auth.uid());