import React from 'react';
import { FlaskConical } from 'lucide-react';
import { MOCK_CREDENTIALS } from './mockMode';

/** DEVELOPMENT-ONLY: lists the mock sign-in identities on the login page and fills the form on click. */
export const MockCredentialsHint: React.FC<{ app: keyof typeof MOCK_CREDENTIALS; onPick: (email: string, password: string) => void }> = ({ app, onPick }) => (
  <div className="mt-6 rounded-lg border border-dashed border-amber-300 bg-amber-50/70 p-3 text-xs text-amber-900">
    <p className="flex items-center gap-1.5 font-semibold">
      <FlaskConical className="w-3.5 h-3.5" /> Mock mode: test accounts (password <code className="font-mono">password123</code>)
    </p>
    <div className="mt-2 flex flex-wrap gap-1.5">
      {MOCK_CREDENTIALS[app].map((c) => (
        <button
          key={c.email}
          type="button"
          onClick={() => onPick(c.email, c.password)}
          className="rounded-md border border-amber-300 bg-white px-2 py-1 font-medium text-amber-900 hover:bg-amber-100"
          title={c.email}
        >
          {c.label}
        </button>
      ))}
    </div>
  </div>
);
