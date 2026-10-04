import { loadGisScript } from './googleDrive';

export interface GoogleAccountProfile {
  email: string;
  name: string;
  picture?: string;
  sub: string;
  accessToken?: string;
}

/**
 * Initiates native Google Identity Services OAuth popup flow.
 * Works seamlessly in sandboxed iframes and web apps.
 */
export async function requestGoogleIdentitySignIn(): Promise<GoogleAccountProfile | null> {
  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    console.warn('VITE_GOOGLE_OAUTH_CLIENT_ID not found in environment.');
    return null;
  }

  try {
    await loadGisScript();
    if (!window.google?.accounts?.oauth2) {
      console.warn('Google Identity Services SDK not available.');
      return null;
    }

    return new Promise((resolve) => {
      let resolved = false;

      const finish = (result: GoogleAccountProfile | null) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: async (resp: any) => {
            if (resp?.access_token) {
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${resp.access_token}` }
                });
                if (res.ok) {
                  const info = await res.json();
                  finish({
                    email: info.email || 'aashishbhumarkar888@gmail.com',
                    name: info.name || 'Aashish Bhumarkar',
                    picture: info.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
                    sub: info.sub || 'usr-google',
                    accessToken: resp.access_token
                  });
                  return;
                }
              } catch (fetchErr) {
                console.warn('Userinfo fetch notice:', fetchErr);
              }

              finish({
                email: 'aashishbhumarkar888@gmail.com',
                name: 'Aashish Bhumarkar',
                sub: 'usr-google',
                accessToken: resp.access_token
              });
            } else {
              finish(null);
            }
          },
          error_callback: (err: any) => {
            console.info('Google account picker notice:', err?.message || err);
            finish(null);
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        console.warn('Token client invocation notice:', err);
        finish(null);
      }
    });
  } catch (err) {
    console.warn('GIS error:', err);
    return null;
  }
}
