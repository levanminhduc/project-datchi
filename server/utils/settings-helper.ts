import { supabaseAdmin } from '../db/supabase'

export async function getPartialConeRatio(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .select('value')
    .eq('key', 'partial_cone_ratio')
    .single()

  if (error || !data) {
    return 0.3
  }

  const raw = typeof data.value === 'string' ? data.value : JSON.stringify(data.value)
  return parseFloat(raw) || 0.3
}
