// Mock Supabase functionality
export const createClient = () => ({
  auth: {
    signInWithOAuth: async () => ({}),
    signOut: async () => ({}),
  },
});

export const middleware = {
  updateSession: () => null,
};

export const queries = {
  getUser: async () => null,
  getPosts: async () => [],
};

export const mutations = {
  updateUser: async () => null,
};

export const server = {
  createClient: () => ({
    auth: {
      signInWithOAuth: async () => ({}),
    },
  }),
}; 