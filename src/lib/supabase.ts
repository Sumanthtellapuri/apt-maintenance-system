import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'tenant' | 'landlord';
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  photo_url?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface RequestComment {
  id: string;
  request_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles?: Profile;
}
