import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { CustomSupabaseAdapter } from './custom-supabase-adapter';
import config from '@/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const authOptions: any = {
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
    EmailProvider({
      from: process.env.RESEND_EMAIL!,
      // Keep server block only if you still want SMTP fallback; otherwise remove it.
      sendVerificationRequest: async ({ identifier, url }) => {
        await resend.emails.send({
          from: process.env.RESEND_EMAIL!,
          to: identifier,
          subject: 'Your sign-in link',
          html: `<p>Click to sign in:</p><p><a href="${url}">${url}</a></p>`,
          text: `Sign in: ${url}`,
        });
      },
    }),
  ],

  // Use database sessions when adapter is provided
  session: {
    strategy: 'database',
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

// Helper function for API routes to get session
export async function getAuthSession(): Promise<any> {
  const { getServerSession } = await import('next-auth');
  return getServerSession(authOptions);
}

export default NextAuth(authOptions);
