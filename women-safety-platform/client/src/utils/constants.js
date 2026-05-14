export const API_URL = '/api';

export const EMERGENCY_TYPES = [
  { value: 'harassment', label: 'Harassment', color: 'text-orange-400', icon: '⚠️' },
  { value: 'stalking', label: 'Stalking', color: 'text-yellow-400', icon: '👁️' },
  { value: 'assault', label: 'Assault', color: 'text-red-400', icon: '🚨' },
  { value: 'accident', label: 'Accident', color: 'text-blue-400', icon: '🚗' },
  { value: 'medical', label: 'Medical Emergency', color: 'text-green-400', icon: '🏥' },
  { value: 'other', label: 'Other', color: 'text-gray-400', icon: '📍' }
];

export const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'badge-warning', dotColor: 'bg-amber-400' },
  accepted: { label: 'Accepted', color: 'badge-info', dotColor: 'bg-primary-400' },
  in_progress: { label: 'In Progress', color: 'badge-info', dotColor: 'bg-blue-400' },
  resolved: { label: 'Resolved', color: 'badge-success', dotColor: 'bg-emerald-400' },
  cancelled: { label: 'Cancelled', color: 'badge-neutral', dotColor: 'bg-dark-400' }
};

export const VERIFICATION_STATUS = {
  pending: { label: 'Pending Review', color: 'badge-warning' },
  verified: { label: 'Verified', color: 'badge-success' },
  rejected: { label: 'Rejected', color: 'badge-danger' }
};

export const ID_DOCUMENT_TYPES = [
  { value: 'aadhar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' }
];

export const SPECIALIZATIONS = [
  { value: 'first_aid', label: 'First Aid' },
  { value: 'self_defense', label: 'Self Defense' },
  { value: 'counseling', label: 'Counseling' },
  { value: 'legal_aid', label: 'Legal Aid' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'general', label: 'General Support' }
];

// Default map center (Bangalore, India)
export const DEFAULT_CENTER = [12.9716, 77.5946];
export const DEFAULT_ZOOM = 13;
