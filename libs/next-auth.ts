import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { CustomSupabaseAdapter } from './custom-supabase-adapter';
import { Resend } from 'resend';
import config from '@/config';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const authOptions = {
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  adapter: CustomSupabaseAdapter(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    // Simple Email provider using Resend SMTP
    ...(process.env.RESEND_API_KEY
      ? [
          EmailProvider({
            server: {
              host: 'smtp.resend.com',
              port: 587,
              auth: {
                user: 'resend',
                pass: process.env.RESEND_API_KEY,
              },
            },
            from: config.resend.fromNoReply!,
          }),
        ]
      : []),
  ],

  // Use database sessions when adapter is provided
  session: {
    strategy: 'database' as const,
  },

  callbacks: {
    async session({ session, user }: any) {
      // With database sessions, user comes from the database via adapter
      if (user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  theme: {
    brandColor: config.colors.main,
    // Add you own logo below. Recommended size is rectangle (i.e. 200x50px) and show your logo + name.
    // It will be used in the login flow to display your logo. If you don't add it, it will look faded.
    logo: `https://${config.domainName}/logoAndName.png`,
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
