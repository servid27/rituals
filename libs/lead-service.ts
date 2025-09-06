import { supabase, createSupabaseAdmin } from './supabase';

export interface Lead {
  id?: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export class LeadService {
  static async create(email: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .insert({ email: email.toLowerCase().trim() })
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return null;
    }

    return data;
  }

  static async findByEmail(email: string): Promise<Lead | null> {
    const { data, error } = await supabase.from('leads').select('*').eq('email', email.toLowerCase().trim()).single();

    if (error) {
      console.error('Error finding lead by email:', error);
      return null;
    }

    return data;
  }

  static async getAllLeads(): Promise<Lead[]> {
    const supabaseAdmin = createSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all leads:', error);
      return [];
    }

    return data || [];
  }

  static async getLeadCount(): Promise<number> {
    const supabaseAdmin = createSupabaseAdmin();
    const { count, error } = await supabaseAdmin.from('leads').select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting lead count:', error);
      return 0;
    }

    return count || 0;
  }

  static async delete(id: string): Promise<boolean> {
    const supabaseAdmin = createSupabaseAdmin();
    const { error } = await supabaseAdmin.from('leads').delete().eq('id', id);

    if (error) {
      console.error('Error deleting lead:', error);
      return false;
    }

    return true;
  }
}

export default LeadService;
