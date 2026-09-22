import { test as base } from '@playwright/test';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthProvider {
  getEnvironment(): string;
  getUserIdentifier(user?: AuthUser): string;
  extractToken(response: any): string | null;
  extractCookies(response: any): Record<string, string>;
  isTokenExpired(token: string): boolean;
  manageAuthToken(token: string): Promise<void>;
}

export class DefaultAuthProvider implements AuthProvider {
  getEnvironment(): string {
    return process.env.TEST_ENV || 'local';
  }

  getUserIdentifier(user?: AuthUser): string {
    return user?.id || 'default-user';
  }

  extractToken(response: any): string | null {
    return response?.token || response?.accessToken || null;
  }

  extractCookies(response: any): Record<string, string> {
    // TODO: Configure cookie name mapping when auth API endpoint is finalized
    return {};
  }

  isTokenExpired(token: string): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return Date.now() >= payload.exp * 1000;
    } catch {
      return false;
    }
  }

  async manageAuthToken(token: string): Promise<void> {
    // TODO: Implement token storage persistence
  }
}

export type AuthFixtureOptions = {
  authProvider: AuthProvider;
  authToken: string;
};

export const test = base.extend<AuthFixtureOptions>({
  authProvider: [
    async ({}, use) => {
      await use(new DefaultAuthProvider());
    },
    { option: true },
  ],
  authToken: [
    async ({}, use) => {
      // Return mock auth token for test environment
      await use('mock-jwt-auth-token');
    },
    { option: true },
  ],
});
