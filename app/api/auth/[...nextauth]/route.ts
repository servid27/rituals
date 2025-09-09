import NextAuth from 'next-auth';
import { authOptions } from '@/libs/next-auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Force Node.js runtime for proper NextAuth compatibility
export const runtime = 'nodejs';
