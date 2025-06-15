// Auth utilities with custom LINE provider setup
import { authOptions as baseAuthOptions, getServerAuthSession } from './auth';
import { LineOAuthProvider } from '@/features/auth/line-provider';
import { env } from '@/env.mjs';
import { getLineCallbackUrl } from '@/lib/constants/domain';

// Use modified auth options with custom LINE provider that uses environment-based callback URL
const authOptions = {
  ...baseAuthOptions,
  providers: [
    LineOAuthProvider({
      clientId: env.LINE_CLIENT_ID,
      clientSecret: env.LINE_CLIENT_SECRET,
      // 🔐 Security: ใช้ environment variable แทน hardcode
      callbackUrl: getLineCallbackUrl(),
    }),
  ],
};

export { authOptions, getServerAuthSession };
