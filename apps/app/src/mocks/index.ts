// Mock implementations for workspace dependencies
// This file is used in production deployments when workspace packages aren't available

// Mock UI components
export const mockUI = {
  Button: (props: any) => null,
  Icons: {
    Spinner: () => null,
    Google: () => null,
    LogOut: () => null,
  },
  cn: (...inputs: any[]) => '',
  globals: {},
};

// Mock Supabase
export const mockSupabase = {
  createClient: () => ({
    auth: {
      signInWithOAuth: async () => ({}),
      signOut: async () => ({}),
    },
  }),
  middleware: {
    updateSession: () => null,
  },
  queries: {
    getUser: async () => null,
    getPosts: async () => [],
  },
  mutations: {
    updateUser: async () => null,
  },
  server: {
    createClient: () => ({
      auth: {
        signInWithOAuth: async () => ({}),
      },
    }),
  },
};

// Mock analytics
export const mockAnalytics = {
  setupAnalytics: () => null,
  server: {
    setupAnalytics: () => null,
  },
};

// Mock KV
export const mockKV = {
  ratelimit: () => ({
    limit: () => ({
      success: true,
      limit: 10,
      remaining: 10,
      reset: Date.now() + 60000,
    }),
  }),
};

// Mock logger
export const mockLogger = {
  logger: {
    error: console.error,
    info: console.info,
    warn: console.warn,
  },
}; 