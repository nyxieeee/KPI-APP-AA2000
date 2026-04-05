import { Transmission } from '../types';

/**
 * Returns a human-readable status label for a submission based on its lifecycle stage.
 * - No status + no supervisorRecommendation = "Submitted" (waiting for supervisor)
 * - No status + has supervisorRecommendation = "Reviewed" (waiting for admin finalization)
 * - status === 'validated' = "Finalized – Approved"
 * - status === 'rejected' = "Finalized – Needs Changes"
 */
export function getSubmissionStatusLabel(t: Pick<Transmission, 'status' | 'supervisorRecommendation'>): string {
  if (t.status === 'validated') return 'Finalized – Approved';
  if (t.status === 'rejected') return 'Finalized – Needs Changes';
  if (t.supervisorRecommendation) return 'Reviewed';
  return 'Submitted';
}

export function getSubmissionStatusSubLabel(t: Pick<Transmission, 'status' | 'supervisorRecommendation'>): string {
  if (t.status === 'validated') return 'Admin has finalized and approved this submission';
  if (t.status === 'rejected') return 'Admin has finalized — see supervisor comments';
  if (t.supervisorRecommendation) return 'Supervisor reviewed — waiting for admin finalization';
  return 'Waiting for supervisor review';
}

export function getSubmissionStatusColor(t: Pick<Transmission, 'status' | 'supervisorRecommendation'>): 'emerald' | 'red' | 'orange' | 'blue' {
  if (t.status === 'validated') return 'emerald';
  if (t.status === 'rejected') return 'red';
  if (t.supervisorRecommendation) return 'orange';
  return 'blue';
}
