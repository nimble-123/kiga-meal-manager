import { supabase } from '../supabase';

// Pro-User-Flag (ersetzt das alte 'tourCompleted'). Ohne Session -> false/no-op.
export async function getTourCompleted() {
  if (!supabase) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from('profiles').select('tour_completed').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return !!(data && data.tour_completed);
}

export async function setTourCompleted(val) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('profiles').upsert({ user_id: user.id, tour_completed: !!val }, { onConflict: 'user_id' });
  if (error) throw error;
}
