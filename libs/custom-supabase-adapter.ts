import type { Adapter } from 'next-auth/adapters';
import { createClient } from '@supabase/supabase-js';

export function CustomSupabaseAdapter(url: string, secret: string): Adapter {
  const supabase = createClient(url, secret, {
    auth: { persistSession: false },
  });

  return {
    async createUser(user: any) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          email: user.email,
          name: user.name,
          image: user.image,
          email_verified: user.emailVerified,
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image,
        emailVerified: data.email_verified,
      };
    },

    async getUser(id: string) {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();

      if (error) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image,
        emailVerified: data.email_verified,
      };
    },

    async getUserByEmail(email: string) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

      if (error) return null;
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image,
        emailVerified: data.email_verified,
      };
    },

    async getUserByAccount({ providerAccountId, provider }: any) {
      // First get the account
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('user_id')
        .eq('provider', provider)
        .eq('provider_account_id', providerAccountId)
        .single();

      if (accountError || !accountData) return null;

      // Then get the user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', accountData.user_id)
        .single();

      if (userError || !userData) return null;

      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        image: userData.image,
        emailVerified: userData.email_verified,
      };
    },

    async updateUser(user: any) {
      const { error } = await supabase
        .from('users')
        .update({
          email: user.email,
          name: user.name,
          image: user.image,
          email_verified: user.emailVerified,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Fetch the updated user separately
      const { data, error: fetchError } = await supabase.from('users').select('*').eq('id', user.id).single();

      if (fetchError) throw fetchError;

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        image: data.image,
        emailVerified: data.email_verified,
      };
    },

    async linkAccount(account: any) {
      const { error } = await supabase.from('accounts').insert({
        id: crypto.randomUUID(),
        user_id: account.userId,
        type: account.type,
        provider: account.provider,
        provider_account_id: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      });

      if (error) throw error;
    },

    async unlinkAccount({ providerAccountId, provider }: any) {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('provider', provider)
        .eq('provider_account_id', providerAccountId);

      if (error) throw error;
    },

    async createSession({ sessionToken, userId, expires }: any) {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          id: crypto.randomUUID(),
          session_token: sessionToken,
          user_id: userId,
          expires: expires.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return {
        sessionToken: data.session_token,
        userId: data.user_id,
        expires: new Date(data.expires),
      };
    },

    async getSessionAndUser(sessionToken: string) {
      const { data, error } = await supabase
        .from('sessions')
        .select(
          `
          *,
          users (
            id,
            email,
            name,
            image,
            email_verified
          )
        `
        )
        .eq('session_token', sessionToken)
        .single();

      if (error) return null;
      const user = (data as any).users;
      return {
        session: {
          sessionToken: data.session_token,
          userId: data.user_id,
          expires: new Date(data.expires),
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.email_verified,
        },
      };
    },

    async updateSession({ sessionToken, expires, userId }: any) {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          expires: expires?.toISOString(),
          user_id: userId,
        })
        .eq('session_token', sessionToken)
        .select()
        .single();

      if (error) throw error;
      return {
        sessionToken: data.session_token,
        userId: data.user_id,
        expires: new Date(data.expires),
      };
    },

    async deleteSession(sessionToken: string) {
      const { error } = await supabase.from('sessions').delete().eq('session_token', sessionToken);

      if (error) throw error;
    },

    async createVerificationToken({ identifier, expires, token }: any) {
      const { data, error } = await supabase
        .from('verification_tokens')
        .insert({
          identifier,
          token,
          expires: expires.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return {
        identifier: data.identifier,
        token: data.token,
        expires: new Date(data.expires),
      };
    },

    async useVerificationToken({ identifier, token }: any) {
      const { data, error } = await supabase
        .from('verification_tokens')
        .delete()
        .eq('identifier', identifier)
        .eq('token', token)
        .select()
        .single();

      if (error) return null;
      return {
        identifier: data.identifier,
        token: data.token,
        expires: new Date(data.expires),
      };
    },
  };
}
