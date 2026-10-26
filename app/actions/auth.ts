'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNext, siteUrl } from '@/lib/auth';

function back(path: string, message: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}error=${encodeURIComponent(message)}`);
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get('full_name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const employerId = String(formData.get('employer_id') || '');
  const isPartner = formData.get('type') === 'partner';
  const password = String(formData.get('password') || '');

  if (!fullName) back('/signup', 'Enter your full name.');
  if (!email.includes('@')) back('/signup', 'Enter your work email address.');
  if (!employerId && !isPartner) back('/signup', 'Choose your employer.');
  if (password.length < 8) back('/signup', 'Use a password with at least 8 characters.');

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, employer_id: isPartner ? '' : employerId },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/card`,
    },
  });
  if (error) back('/signup', error.message);

  redirect(`/signup?sent=1&email=${encodeURIComponent(email)}`);
}

export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const from = String(formData.get('from') || '');
  const base =
    from === 'signup'
      ? `/signup?sent=1&email=${encodeURIComponent(email)}`
      : `/login?resend=1&email=${encodeURIComponent(email)}`;
  if (!email.includes('@')) back(base, 'Enter the email you signed up with.');

  const supabase = createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=/card` },
  });
  if (error && /rate|seconds|security purposes|too many/i.test(error.message)) {
    back(base, 'Please wait a minute before requesting another email.');
  }
  // Same message whether or not the account exists or is already confirmed
  redirect(`${base}&resent=1`);
}

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const next = safeNext(String(formData.get('next') || ''));

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/confirm/i.test(error.message)) {
      back(
        `/login?next=${encodeURIComponent(next)}&resend=1&email=${encodeURIComponent(email)}`,
        'Confirm your email first. Check your inbox (and junk folder) for the link, or send a new one below.'
      );
    }
    back(`/login?next=${encodeURIComponent(next)}`, 'That email and password combination did not match an account.');
  }
  redirect(next);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!email.includes('@')) back('/forgot-password', 'Enter the email you signed up with.');
  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });
  // Same message whether or not the account exists
  redirect('/forgot-password?sent=1');
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password') || '');
  if (password.length < 8) back('/reset-password', 'Use a password with at least 8 characters.');
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) back('/reset-password', error.message);
  redirect('/card?notice=' + encodeURIComponent('Password updated.'));
}
