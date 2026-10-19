/**
 * Turns Supabase's technical error messages into friendly ones.
 * See https://supabase.com/docs/guides/auth/debugging/error-codes
 */
export function friendlyAuthError(error: { code?: string; message: string }): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'That email and password don’t match. Check them and try again.';
    case 'email_not_confirmed':
      return 'Confirm your email first. Check your inbox for the code we sent.';
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Try logging in.';
    case 'weak_password':
      return 'Choose a stronger password: at least 8 characters.';
    case 'otp_expired':
      return 'That code is wrong or has expired. Request a new one.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Wait a few minutes and try again.';
    case 'email_address_invalid':
      return 'Enter a valid email address.';
    case 'same_password':
      return 'Your new password must be different from your old one.';
  }
  if (/network|fetch/i.test(error.message)) {
    return 'Couldn’t connect. Check your internet connection and try again.';
  }
  return error.message;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const MIN_PASSWORD_LENGTH = 8;

/** The version of the consent wording users agree to at sign-up. */
export const CONSENT_VERSION = '2026-10-19';
