import { PublicClientApplication, Configuration, AuthenticationResult, AccountInfo } from '@azure/msal-node';
import { BrowserWindow, shell } from 'electron';
import * as http from 'http';
import * as url from 'url';
import Store from 'electron-store';

// Microsoft App Registration settings
// Users need to register their own app at https://portal.azure.com
// and update these values, or we provide defaults for development
const MICROSOFT_CONFIG = {
  // Default client ID - users should replace with their own
  clientId: process.env.MICROSOFT_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
  // Using common for multi-tenant support
  authority: 'https://login.microsoftonline.com/common',
  // Scopes needed for To Do access
  scopes: ['Tasks.ReadWrite', 'User.Read', 'offline_access'],
};

// Store schema type
interface TokenStoreSchema {
  microsoftAccount: AccountInfo | null;
  microsoftTokenCache: string | null;
}

// Store for tokens - use 'any' to avoid electron-store typing issues
const tokenStore = new Store({
  name: 'microsoft-auth',
  encryptionKey: 'george-ticker-ms-auth-key',
  defaults: {
    microsoftAccount: null,
    microsoftTokenCache: null,
  },
}) as Store<TokenStoreSchema> & {
  get<K extends keyof TokenStoreSchema>(key: K): TokenStoreSchema[K];
  set<K extends keyof TokenStoreSchema>(key: K, value: TokenStoreSchema[K]): void;
  delete<K extends keyof TokenStoreSchema>(key: K): void;
  clear(): void;
};

let msalClient: PublicClientApplication | null = null;
let authWindow: BrowserWindow | null = null;
let localServer: http.Server | null = null;

// Initialize MSAL client
function getMsalClient(): PublicClientApplication {
  if (!msalClient) {
    const config: Configuration = {
      auth: {
        clientId: MICROSOFT_CONFIG.clientId,
        authority: MICROSOFT_CONFIG.authority,
      },
      cache: {
        // Load cached tokens if available
        cachePlugin: {
          beforeCacheAccess: async (context) => {
            const cache = tokenStore.get('microsoftTokenCache');
            if (cache) {
              context.tokenCache.deserialize(cache);
            }
          },
          afterCacheAccess: async (context) => {
            if (context.cacheHasChanged) {
              tokenStore.set('microsoftTokenCache', context.tokenCache.serialize());
            }
          },
        },
      },
    };
    msalClient = new PublicClientApplication(config);
  }
  return msalClient;
}

// Start local server to receive OAuth redirect
function startLocalServer(): Promise<{ port: number; server: http.Server }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();

    // Find an available port
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        resolve({ port: address.port, server });
      } else {
        reject(new Error('Failed to get server address'));
      }
    });

    server.on('error', reject);
  });
}

// Sign in with Microsoft
export async function signInWithMicrosoft(): Promise<{ success: boolean; account?: AccountInfo; error?: string }> {
  try {
    const client = getMsalClient();

    // Check if we have a cached account
    const cachedAccount = tokenStore.get('microsoftAccount');
    if (cachedAccount) {
      try {
        // Try to get token silently first
        const silentResult = await client.acquireTokenSilent({
          scopes: MICROSOFT_CONFIG.scopes,
          account: cachedAccount,
        });

        if (silentResult) {
          return { success: true, account: silentResult.account || undefined };
        }
      } catch {
        // Silent acquisition failed, need interactive login
        console.log('Silent token acquisition failed, starting interactive login');
      }
    }

    // Start local server for redirect
    const { port, server } = await startLocalServer();
    localServer = server;
    const redirectUri = `http://localhost:${port}/auth/callback`;

    // Get authorization URL
    const authUrl = await client.getAuthCodeUrl({
      scopes: MICROSOFT_CONFIG.scopes,
      redirectUri,
    });

    // Create promise to handle the callback
    const authPromise = new Promise<AuthenticationResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Authentication timed out'));
      }, 300000); // 5 minute timeout

      server.on('request', async (req, res) => {
        if (req.url?.startsWith('/auth/callback')) {
          const parsedUrl = url.parse(req.url, true);
          const code = parsedUrl.query.code as string;
          const error = parsedUrl.query.error as string;

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end('<html><body><h1>Authentication Failed</h1><p>You can close this window.</p></body></html>');
            clearTimeout(timeout);
            cleanup();
            reject(new Error(error));
            return;
          }

          if (code) {
            try {
              const tokenResult = await client.acquireTokenByCode({
                code,
                scopes: MICROSOFT_CONFIG.scopes,
                redirectUri,
              });

              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end('<html><body><h1>Authentication Successful!</h1><p>You can close this window and return to George\'s Ticker.</p><script>window.close();</script></body></html>');

              clearTimeout(timeout);
              cleanup();
              resolve(tokenResult);
            } catch (tokenError) {
              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end('<html><body><h1>Token Exchange Failed</h1><p>You can close this window.</p></body></html>');
              clearTimeout(timeout);
              cleanup();
              reject(tokenError);
            }
          }
        }
      });
    });

    // Open browser for authentication
    await shell.openExternal(authUrl);

    // Wait for authentication
    const result = await authPromise;

    if (result.account) {
      tokenStore.set('microsoftAccount', result.account);
      return { success: true, account: result.account };
    }

    return { success: false, error: 'No account returned' };
  } catch (error) {
    console.error('Microsoft sign-in error:', error);
    cleanup();
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Sign out
export async function signOutFromMicrosoft(): Promise<void> {
  tokenStore.delete('microsoftAccount');
  tokenStore.delete('microsoftTokenCache');
  msalClient = null;
}

// Get current account
export function getMicrosoftAccount(): AccountInfo | null {
  return tokenStore.get('microsoftAccount') || null;
}

// Get access token (for API calls)
export async function getMicrosoftAccessToken(): Promise<string | null> {
  try {
    const client = getMsalClient();
    const account = tokenStore.get('microsoftAccount');

    if (!account) {
      return null;
    }

    const result = await client.acquireTokenSilent({
      scopes: MICROSOFT_CONFIG.scopes,
      account,
    });

    return result?.accessToken || null;
  } catch (error) {
    console.error('Failed to get access token:', error);
    // Token might be expired, user needs to sign in again
    return null;
  }
}

// Check if signed in
export function isMicrosoftSignedIn(): boolean {
  return !!tokenStore.get('microsoftAccount');
}

// Cleanup function
function cleanup() {
  if (localServer) {
    localServer.close();
    localServer = null;
  }
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.close();
    authWindow = null;
  }
}

// Get Microsoft config status (for UI to show if configured)
export function getMicrosoftConfigStatus(): { configured: boolean; clientId: string } {
  return {
    configured: MICROSOFT_CONFIG.clientId !== 'YOUR_CLIENT_ID_HERE',
    clientId: MICROSOFT_CONFIG.clientId,
  };
}
