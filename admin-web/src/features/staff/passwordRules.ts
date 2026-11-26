import { z } from 'zod';

/** Mirrors the backend password policy (the server remains the authority). */
export const passwordRules = z
  .string()
  .min(10, 'At least 10 characters')
  .max(128, 'At most 128 characters')
  .regex(/[A-Za-z]/, 'Must contain a letter')
  .regex(/[0-9]/, 'Must contain a digit');

/** Random initial password that satisfies the policy. */
export const generatePassword = (length = 14): string => {
  const letters = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const all = letters + digits + symbols;
  const pick = (set: string, n: number) => {
    const buf = new Uint32Array(n);
    crypto.getRandomValues(buf);
    return Array.from(buf, (x) => set[x % set.length]);
  };
  const chars = [...pick(letters, 1), ...pick(digits, 1), ...pick(all, length - 2)];
  // shuffle
  const order = new Uint32Array(chars.length);
  crypto.getRandomValues(order);
  return chars
    .map((c, i) => ({ c, k: order[i] }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c)
    .join('');
};
