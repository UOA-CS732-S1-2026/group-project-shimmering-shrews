/**
 * Shared configuration constants
 * 
 * IMPORTANT: Some constants (like ALLOWED_COMPLETION_RADIUS_METERS) must match
 * the frontend values. If you update these, sync them with frontend code.
 */

// Distance in meters. User must be within this radius of challenge location to complete it.
// Must match frontend/src/pages/ChallengeDetailView.tsx maxDistance
export const ALLOWED_COMPLETION_RADIUS_METERS = 700
