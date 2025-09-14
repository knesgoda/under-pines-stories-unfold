import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RewardRequest {
  activityType: 'post_create' | 'post_like' | 'post_share' | 'dm_send' | 'comment_create' | 'daily_login';
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { activityType }: RewardRequest = await req.json();

    // Define reward probabilities and items for each activity
    const rewardRules = {
      post_create: [
        { item: 'chocolate', chance: 0.3 },
        { item: 'graham_crackers', chance: 0.3 },
        { item: 'marshmallows', chance: 0.3 },
        { item: 'stick', chance: 0.8 }
      ],
      post_like: [
        { item: 'marshmallows', chance: 0.2 },
        { item: 'chocolate', chance: 0.1 }
      ],
      post_share: [
        { item: 'fire', chance: 0.1 },
        { item: 'chocolate', chance: 0.4 },
        { item: 'graham_crackers', chance: 0.3 }
      ],
      dm_send: [
        { item: 'ketchup', chance: 0.2 },
        { item: 'mustard', chance: 0.2 },
        { item: 'relish', chance: 0.1 }
      ],
      comment_create: [
        { item: 'hot_dog_buns', chance: 0.3 },
        { item: 'stick', chance: 0.4 }
      ],
      daily_login: [
        { item: 'fire', chance: 0.3 },
        { item: 'stick', chance: 0.6 }
      ]
    };

    // Check for recent rewards to prevent spam
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentRewards } = await supabaseClient
      .from('activity_rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_type', activityType)
      .gte('rewarded_at', oneHourAgo);

    if (recentRewards && recentRewards.length > 0 && activityType !== 'daily_login') {
      return new Response(JSON.stringify({ 
        awarded: [],
        message: 'You\'ve already been rewarded for this activity recently!' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For daily login, check if already claimed today
    if (activityType === 'daily_login') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayRewards } = await supabaseClient
        .from('activity_rewards')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_type', 'daily_login')
        .gte('rewarded_at', todayStart.toISOString());

      if (todayRewards && todayRewards.length > 0) {
        return new Response(JSON.stringify({ 
          awarded: [],
          message: 'You\'ve already claimed your daily rewards!' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const rules = rewardRules[activityType] || [];
    const awarded: Array<{ item_slug: string; qty: number }> = [];

    // Roll for each possible reward
    for (const rule of rules) {
      if (Math.random() < rule.chance) {
        awarded.push({ item_slug: rule.item, qty: 1 });
      }
    }

    if (awarded.length > 0) {
      // Update user inventory
      for (const reward of awarded) {
        await supabaseClient
          .from('user_inventory')
          .upsert({
            user_id: user.id,
            item_slug: reward.item_slug,
            quantity: 1
          }, {
            onConflict: 'user_id,item_slug'
          });

        // If item exists, increment quantity
        await supabaseClient.rpc('increment_inventory', {
          p_user_id: user.id,
          p_item_slug: reward.item_slug,
          p_quantity: reward.qty
        });
      }

      // Log the reward
      await supabaseClient
        .from('activity_rewards')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          items_earned: awarded
        });
    }

    return new Response(JSON.stringify({ awarded }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in game-reward function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});