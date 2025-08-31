-- Create DM tables for direct messaging functionality

-- Table for 1:1 conversations
CREATE TABLE public.dm_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for conversation membership
CREATE TABLE public.dm_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'pending')),
  last_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Table for individual messages
CREATE TABLE public.dm_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_dm_members_conversation_id ON public.dm_members(conversation_id);
CREATE INDEX idx_dm_members_user_id ON public.dm_members(user_id);
CREATE INDEX idx_dm_messages_conversation_id ON public.dm_messages(conversation_id);
CREATE INDEX idx_dm_messages_created_at ON public.dm_messages(created_at);

-- Enable RLS
ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dm_conversations
CREATE POLICY "Users can view conversations they are members of"
ON public.dm_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dm_members dm
    WHERE dm.conversation_id = id AND dm.user_id = auth.uid()
  )
);

-- RLS Policies for dm_members
CREATE POLICY "Users can view members of conversations they belong to"
ON public.dm_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dm_members dm
    WHERE dm.conversation_id = conversation_id AND dm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own membership"
ON public.dm_members
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert conversation members"
ON public.dm_members
FOR INSERT
WITH CHECK (true);

-- RLS Policies for dm_messages
CREATE POLICY "Users can view messages in conversations they belong to"
ON public.dm_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.dm_members dm
    WHERE dm.conversation_id = conversation_id AND dm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to conversations they belong to"
ON public.dm_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.dm_members dm
    WHERE dm.conversation_id = conversation_id AND dm.user_id = auth.uid() AND dm.state = 'active'
  )
);

-- RPC function to start a conversation
CREATE OR REPLACE FUNCTION public.dm_start(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY definer
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

-- RPC function to accept/decline message requests
CREATE OR REPLACE FUNCTION public.dm_set_request(conversation_id UUID, accept BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY definer
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

-- RPC function to mark messages as read
CREATE OR REPLACE FUNCTION public.dm_mark_read(conversation_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  UPDATE dm_members 
  SET last_read_at = now()
  WHERE dm_members.conversation_id = dm_mark_read.conversation_id 
    AND user_id = auth.uid();
    
  RETURN json_build_object('success', true);
END;
$$;