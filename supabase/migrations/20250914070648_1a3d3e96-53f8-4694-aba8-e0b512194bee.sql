-- Create function to increment inventory quantity
CREATE OR REPLACE FUNCTION public.increment_inventory(
  p_user_id UUID,
  p_item_slug TEXT,
  p_quantity INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_inventory (user_id, item_slug, quantity)
  VALUES (p_user_id, p_item_slug, p_quantity)
  ON CONFLICT (user_id, item_slug) 
  DO UPDATE SET 
    quantity = public.user_inventory.quantity + p_quantity,
    updated_at = now();
END;
$$;