import PocketBase from 'pocketbase';

// Initialize PocketBase client
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090');

// Disable auto-cancellation for requests
pb.autoCancellation(false);

// Export the client
export default pb;

// Helper to check if user is authenticated
export const isAuthenticated = () => {
    return pb.authStore.isValid;
};

// Helper to get current user
export const getCurrentUser = () => {
    return pb.authStore.record;
};

// Helper to get auth token for n8n webhooks
export const getAuthToken = () => {
    return pb.authStore.token;
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback) => {
    return pb.authStore.onChange(callback);
};

// Helper function to handle file URLs
export const getFileUrl = (record, filename) => {
    if (!filename) return null;
    return pb.files.getURL(record, filename);
};

// Helper to expand relations in queries
export const withExpand = (...relations) => {
    return { expand: relations.join(',') };
};
