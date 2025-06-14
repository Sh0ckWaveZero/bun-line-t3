// Auth utilities with custom LINE provider setup
import { authOptions as baseAuthOptions, getServerAuthSession } from './auth';
import { LineOAuthProvider } from '~/features/auth/line-provider';
import { env } from '~/env.mjs';

// Use modified auth options with custom LINE provider that forces production callback URL
const authOptions = {
  ...baseAuthOptions,
  providers: [
    LineOAuthProvider({
      clientId: env.LINE_CLIENT_ID,
      clientSecret: env.LINE_CLIENT_SECRET,
      callbackUrl: 'https://line-login.midseelee.com/api/auth/callback/line',
    }),
  ],
};

export { authOptions, getServerAuthSession };
