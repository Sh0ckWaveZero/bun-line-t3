import LineProvider from 'next-auth/providers/line';
import { APP_DOMAIN } from '~/lib/constants/domain';

// Constants  
// 🔐 Security: ใช้ environment variable แทน hardcode
const PRODUCTION_URL = APP_DOMAIN;
const LINE_AUTH_URL = 'https://access.line.me/oauth2/v2.1/authorize';
const LINE_TOKEN_URL = 'https://api.line.me/oauth2/v2.1/token';
const LINE_USERINFO_URL = 'https://api.line.me/v2/profile';

// Custom options type
type LineOAuthProviderOptions = {
  clientId: string;
  clientSecret: string;
  callbackUrl?: string; // Always override to production
};

/**
 * Custom LINE provider that forces production callback URL
 */
export function LineOAuthProvider(options: LineOAuthProviderOptions) {
  const callbackUrl = `${PRODUCTION_URL}/api/auth/callback/line`;
  
  return LineProvider({
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorization: {
      url: LINE_AUTH_URL,
      params: {
        response_type: 'code',
        scope: 'openid profile',
        // Always use production callback URL
        redirect_uri: callbackUrl
      }
    },
    token: {
      url: LINE_TOKEN_URL,
      params: { 
        // Always use production callback URL for token requests
        redirect_uri: callbackUrl 
      }
    },
    userinfo: {
      url: LINE_USERINFO_URL,
      async request({ tokens }) {
        // Perform standard LINE userinfo request with access token
        const response = await fetch(LINE_USERINFO_URL, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });
        
        if (!response.ok) {
          console.error('LINE userinfo error:', await response.text());
          return null;
        }
        
        return await response.json();
      }
    },
    profile(profile) {
      return {
        id: profile.userId,
        name: profile.displayName,
        email: null,
        image: profile.pictureUrl,
      };
    },
  });
}
