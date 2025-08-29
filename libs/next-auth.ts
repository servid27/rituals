import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { Resend } from 'resend';
import config from '@/config';
import connectMongo from './mongo';
import { MongoDBAdapter } from '@auth/mongodb-adapter';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
          createdAt: new Date(),
        };
      },
    }),
    // Custom email provider with Resend API integration
    ...(connectMongo && resend
      ? [
          {
            id: 'email',
            name: 'Email',
            type: 'email' as const,
            from: config.resend.fromNoReply,
            maxAge: 24 * 60 * 60, // 24 hours
            async sendVerificationRequest({ identifier, url }: { identifier: string; url: string }) {
              try {
                await resend.emails.send({
                  from: config.resend.fromNoReply,
                  to: identifier,
                  subject: `Sign in to ${config.appName}`,
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background-color: white; line-height: 1.5; }
                      </style>
                    </head>
                    <body style="background-color: white; padding: 24px;">
                      <div style="max-width: 600px; margin: 0 auto;">
                        
                        <!-- Main Card -->
                        <div style="background: white; border-radius: 32px; border: 2px dashed #f3f0e8; box-shadow: 0 10px 15px -3px rgba(180, 166, 140, 0.1); overflow: hidden;">
                          
                          <!-- Header -->
                          <div style="padding: 24px 24px 16px 24px; text-align: center;">
                            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">${config.appName}</h1>
                            <p style="font-size: 14px;">Your ritual companion</p>
                          </div>

                          <!-- Content -->
                          <div style="padding: 0 24px 24px 24px;">
                            
                            <!-- Sign in card -->
                            <div style="border: 2px dashed #ccc; border-radius: 16px; padding: 20px; margin-bottom: 20px; text-align: center;">
                              <div style="font-weight: 600; margin-bottom: 8px;">Ready to continue your journey?</div>
                              <div style="font-size: 12px; margin-bottom: 20px;">Click below to securely access your account</div>
                              
                              <!-- CTA Button -->
                              <a href="${url}" style="
                                display: inline-block;
                                background: #333;
                                color: white;
                                padding: 12px 24px;
                                text-decoration: none;
                                border-radius: 12px;
                                font-weight: 600;
                                font-size: 14px;
                              ">
                                Sign in to ${config.appName}
                              </a>
                            </div>

                            <!-- Features Grid -->
                            <div style="margin: 24px 0;">

                              
                              <!-- Simple message -->
                              <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                                

                                
                              </div>
                            </div>

                            <!-- Alternative Link -->
                            <div style="background: #fef7ed; border: 2px dashed #fdba74; border-radius: 16px; padding: 16px; margin-top: 20px;">
                              <div style="color: #c2410c; font-size: 12px; margin-bottom: 8px; text-align: center;">
                                Or copy and paste this link:
                              </div>
                              <div style="background: white; border: 2px dashed #fed7aa; border-radius: 8px; padding: 8px; word-break: break-all; text-align: center;">
                                <a href="${url}" style="color: #ea580c; text-decoration: none; font-size: 11px;">${url}</a>
                              </div>
                            </div>

                          </div>

                          <!-- Footer -->
                          <div style="background: #fff7ed; padding: 20px; text-align: center; border-top: 2px dashed #fed7aa;">
                            <div style="color: #c2410c; font-size: 11px; margin-bottom: 4px;">
                              This secure link expires in 24 hours for your protection.
                            </div>
                            <div style="color: #c2410c; font-size: 11px;">
                              If you didn't request this, you can safely ignore this email.
                            </div>
                          </div>

                        </div>
                      </div>
                    </body>
                    </html>
                  `,
                });
              } catch (error) {
                console.error('Error sending email with Resend:', error);
                throw error;
              }
            },
          },
        ]
      : []),
  ],
  // New users will be saved in Database (MongoDB Atlas). Each user (model) has some fields like name, email, image, etc..
  // Requires a MongoDB database. Set MONOGODB_URI env variable.
  // Learn more about the model type: https://next-auth.js.org/v3/adapters/models
  ...(connectMongo && { adapter: MongoDBAdapter(connectMongo) }),

  callbacks: {
    session: async ({ session, token }: any) => {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
  },
  theme: {
    brandColor: config.colors.main,
    // Add you own logo below. Recommended size is rectangle (i.e. 200x50px) and show your logo + name.
    // It will be used in the login flow to display your logo. If you don't add it, it will look faded.
    logo: `https://${config.domainName}/logoAndName.png`,
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
