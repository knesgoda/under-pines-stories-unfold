-- Fix security issues with DM functions by setting search_path

-- Update dm_start function
CREATE OR REPLACE FUNCTION public.dm_start(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY definer
SET search_path = 'public'
AS $$
DECLARE
  conv_id UUID;
  existing_conv_id UUID;
  target_is_private BOOLEAN;
  mutual_follow BOOLEAN;
BEGIN
  -- Check if users are mutual followers
  SELECT EXISTS(
    SELECT 1 FROM follows f1
    JOIN follows f2 ON f1.follower_id = f2.followee_id AND f1.followee_id = f2.follower_id
    WHERE f1.follower_id = auth.uid() AND f1.followee_id = target_user_id
  ) INTO mutual_follow;
  
  -- Check if target user is private
  SELECT COALESCE(us.is_private, false) INTO target_is_private
  FROM user_settings us WHERE us.user_id = target_user_id;
  
  -- Check if conversation already exists
  SELECT dm_conversations.id INTO existing_conv_id
  FROM dm_conversations
  JOIN dm_members m1 ON m1.conversation_id = dm_conversations.id AND m1.user_id = auth.uid()
  JOIN dm_members m2 ON m2.conversation_id = dm_conversations.id AND m2.user_id = target_user_id
  LIMIT 1;
  
  -- If conversation exists, return it
  IF existing_conv_id IS NOT NULL THEN
    RETURN json_build_object('conversationId', existing_conv_id);
  END IF;
  
  -- Create new conversation
  INSERT INTO dm_conversations DEFAULT VALUES RETURNING id INTO conv_id;
  
  -- Add current user as active member
  INSERT INTO dm_members (conversation_id, user_id, state)
  VALUES (conv_id, auth.uid(), 'active');
  
  -- Add target user - pending if they're private and not mutual followers
  INSERT INTO dm_members (conversation_id, user_id, state)
  VALUES (conv_id, target_user_id, 
    CASE WHEN target_is_private AND NOT mutual_follow THEN 'pending' ELSE 'active' END
  );
  
  RETURN json_build_object('conversationId', conv_id);
END;
$$;

-- Update dm_set_request function
CREATE OR REPLACE FUNCTION public.dm_set_request(conversation_id UUID, accept BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY definer
SET search_path = 'public'
AS $$
BEGIN
  IF accept THEN
    -- Accept the request - change state to active
    UPDATE dm_members 
    SET state = 'active'
    WHERE dm_members.conversation_id = dm_set_request.conversation_id 
      AND user_id = auth.uid() 
      AND state = 'pending';
  ELSE
    -- Decline - remove the member and delete conversation if empty
    DELETE FROM dm_members 
    WHERE dm_members.conversation_id = dm_set_request.conversation_id 
      AND user_id = auth.uid();
      
    -- Delete conversation if no members remain
    DELETE FROM dm_conversations
    WHERE id = dm_set_request.conversation_id
      AND NOT EXISTS (SELECT 1 FROM dm_members WHERE dm_members.conversation_id = id);
  END IF;
  
  RETURN json_build_object('success', true);
END;
$$;

-- Update dm_mark_read function
CREATE OR REPLACE FUNCTION public.dm_mark_read(conversation_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY definer
SET search_path = 'public'
AS $$
BEGIN
  UPDATE dm_members 
  SET last_read_at = now()
  WHERE dm_members.conversation_id = dm_mark_read.conversation_id 
    AND user_id = auth.uid();
    
  RETURN json_build_object('success', true);
END;
$$;