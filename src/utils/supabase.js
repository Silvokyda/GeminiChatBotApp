import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../config/config';

const { supabaseUrl, supabaseKey } = supabaseConfig;

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };