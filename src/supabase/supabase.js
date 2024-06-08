import { supabaseConfig } from '../config/config';
import { createClient } from '@supabase/supabase-js';

const { supabaseUrl, supabaseKey } = supabaseConfig;

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
