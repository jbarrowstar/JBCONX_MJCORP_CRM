export const BRAND_COLORS = {
  primary: '#274C77',   // Primary Blue
  secondary: '#6096BA', // Secondary Blue
  light: '#A3CEF1',     // Light Blue
  bg: '#E7ECEF',        // Background
  white: '#FFFFFF',     // White
  dark: '#1B3B6F',
  slate: '#8B8C89',
} as const;

export const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  New: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  Assigned: { label: 'Assigned', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  Contacted: { label: 'Contacted', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
  Interested: { label: 'Interested', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  'Meeting Scheduled': { label: 'Meeting Scheduled', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  Converted: { label: 'Converted', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  Registered: { label: 'Registered', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  Onboarded: { label: 'Onboarded', color: 'text-green-800', bg: 'bg-green-100 border-green-300' },
  Lost: { label: 'Lost', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

