-- Create items table for game ingredients and crafted items
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('ingredient', 'tool', 'crafted')),
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user inventory table
CREATE TABLE public.user_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_slug TEXT NOT NULL REFERENCES public.items(slug),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_slug)
);

-- Create recipes table
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  result_item_slug TEXT NOT NULL REFERENCES public.items(slug),
  requires_fire BOOLEAN NOT NULL DEFAULT false,
  requires_campfire BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recipe ingredients junction table
CREATE TABLE public.recipe_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_slug TEXT NOT NULL REFERENCES public.recipes(slug),
  item_slug TEXT NOT NULL REFERENCES public.items(slug),
  quantity_needed INTEGER NOT NULL DEFAULT 1 CHECK (quantity_needed > 0),
  UNIQUE(recipe_slug, item_slug)
);

-- Create activity rewards log
CREATE TABLE public.activity_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('post_create', 'post_like', 'post_share', 'dm_send', 'comment_create', 'daily_login')),
  items_earned JSONB NOT NULL DEFAULT '[]'::jsonb,
  rewarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campfire circles table
CREATE TABLE public.campfire_circles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campfire_circles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Items can be viewed by everyone
CREATE POLICY "Everyone can view items" ON public.items FOR SELECT USING (true);

-- Users can only view and modify their own inventory
CREATE POLICY "Users can view their own inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own inventory" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own inventory" ON public.user_inventory FOR UPDATE USING (auth.uid() = user_id);

-- Recipes can be viewed by everyone
CREATE POLICY "Everyone can view recipes" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Everyone can view recipe ingredients" ON public.recipe_ingredients FOR SELECT USING (true);

-- Users can only view their own activity rewards
CREATE POLICY "Users can view their own activity rewards" ON public.activity_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert activity rewards" ON public.activity_rewards FOR INSERT WITH CHECK (true);

-- Everyone can view active campfire circles
CREATE POLICY "Everyone can view active campfire circles" ON public.campfire_circles FOR SELECT USING (is_active = true);

-- Insert starter items
INSERT INTO public.items (slug, name, emoji, type, rarity, description) VALUES
-- S'mores ingredients
('chocolate', 'Chocolate Bar', '🍫', 'ingredient', 'common', 'Sweet milk chocolate for s''mores'),
('graham_crackers', 'Graham Crackers', '🍪', 'ingredient', 'common', 'Crunchy honey graham crackers'),
('marshmallows', 'Marshmallows', '🤍', 'ingredient', 'common', 'Fluffy white marshmallows for roasting'),

-- Hot dog ingredients  
('hot_dog_buns', 'Hot Dog Buns', '🥖', 'ingredient', 'common', 'Fresh hot dog buns'),
('ketchup', 'Ketchup', '🍅', 'ingredient', 'uncommon', 'Classic tomato ketchup'),
('mustard', 'Mustard', '💛', 'ingredient', 'uncommon', 'Tangy yellow mustard'),
('relish', 'Relish', '🥒', 'ingredient', 'rare', 'Sweet pickle relish'),

-- Tools
('stick', 'Roasting Stick', '🪵', 'tool', 'common', 'Essential for roasting marshmallows'),
('fire', 'Fire', '🔥', 'tool', 'epic', 'Magical campfire flame for cooking'),

-- Crafted items
('smores', 'S''mores', '🍯', 'crafted', 'rare', 'Gooey toasted marshmallow sandwich'),
('hot_dog', 'Hot Dog', '🌭', 'crafted', 'rare', 'Grilled hot dog with condiments');

-- Insert recipes
INSERT INTO public.recipes (slug, name, result_item_slug, requires_fire, requires_campfire, description) VALUES
('smores_recipe', 'S''mores', 'smores', true, true, 'Classic campfire treat with chocolate, marshmallows, and graham crackers'),
('hot_dog_recipe', 'Hot Dog', 'hot_dog', true, true, 'Grilled hot dog with your choice of condiments');

-- Insert recipe ingredients
INSERT INTO public.recipe_ingredients (recipe_slug, item_slug, quantity_needed) VALUES
-- S'mores recipe
('smores_recipe', 'chocolate', 1),
('smores_recipe', 'graham_crackers', 2),
('smores_recipe', 'marshmallows', 1),
('smores_recipe', 'stick', 1),
('smores_recipe', 'fire', 1),

-- Hot dog recipe  
('hot_dog_recipe', 'hot_dog_buns', 1),
('hot_dog_recipe', 'stick', 1),
('hot_dog_recipe', 'fire', 1);

-- Insert default campfire circle
INSERT INTO public.campfire_circles (name, description) VALUES
('Main Campfire', 'The central gathering place where all campers can craft together');

-- Create trigger to update inventory updated_at
CREATE OR REPLACE FUNCTION public.update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_inventory_updated_at
  BEFORE UPDATE ON public.user_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_updated_at();