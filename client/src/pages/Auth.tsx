import { FormEvent, useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import mentorshipGroup from "@/assets/mentorship-group.png";

function AuthFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_560px]">
        <div className="relative hidden overflow-hidden border-r border-white/10 lg:block">
          <img
            src={mentorshipGroup}
            alt="TheTradersCartel seminar"
            className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-black" />
          <Link href="/" className="absolute left-10 top-9">
            <img src="/logo-v2.png" alt="TheTradersCartel" className="w-64" />
          </Link>
          <div className="absolute bottom-14 left-10 max-w-md">
            <p className="font-display text-5xl font-bold uppercase leading-[0.95]">
              Your journal.
              <br />
              Your discipline.
              <br />
              Your edge.
            </p>
            <p className="mt-6 text-sm leading-6 text-white/45">
              A private operating system for TheTradersCartel members.
            </p>
          </div>
        </div>
        <main className="flex min-h-screen flex-col px-6 py-8 sm:px-12 lg:px-16">
          <div className="flex items-center justify-between lg:hidden">
            <Link href="/">
              <img src="/logo-v2.png" alt="TheTradersCartel" className="w-52" />
            </Link>
          </div>
          <div className="my-auto w-full max-w-md py-14">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-sans text-3xl font-semibold normal-case tracking-[-0.04em] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/42">
              {description}
            </p>
            <div className="mt-9">{children}</div>
          </div>
          <p className="text-[10px] text-white/20">
            TheTradersCartel · Members only
          </p>
        </main>
      </div>
    </div>
  );
}

const fieldClass =
  "mt-2 h-12 w-full border border-white/12 bg-white/[0.025] px-4 text-sm text-white outline-none transition focus:border-white/45";
const labelClass =
  "block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/38";
const buttonClass =
  "flex h-12 w-full items-center justify-center gap-2 bg-white text-sm font-semibold text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50";

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="border-l border-white/40 pl-3 text-xs leading-5 text-white/60"
    >
      {message}
    </p>
  );
}

export function LoginPage() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (authError) return setError(authError.message);
    setLocation("/dashboard");
  }
  return (
    <AuthFrame
      eyebrow="Member access"
      title="Sign in"
      description="Access your private dashboard and trading journal."
    >
      <form onSubmit={submit} className="space-y-5">
        {!supabaseConfigured && (
          <ErrorMessage message="Member services are not configured in this environment." />
        )}
        {error && <ErrorMessage message={error} />}
        <label className={labelClass}>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={fieldClass}
          />
        </label>
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-white/45 hover:text-white"
          >
            Forgot password?
          </Link>
        </div>
        <button disabled={busy} className={buttonClass}>
          {busy ? "Signing in…" : "Sign in"}
          <ArrowRight className="size-4" />
        </button>
      </form>
      <p className="mt-7 text-center text-xs text-white/35">
        New student?{" "}
        <Link href="/signup" className="text-white hover:underline">
          Create an account
        </Link>
      </p>
    </AuthFrame>
  );
}

export function SignupPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 10) {
      setBusy(false);
      return setError("Use at least 10 characters for your password.");
    }
    const email = String(form.get("email")).trim().toLowerCase();
    const fullName = String(form.get("fullName")).trim();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/pending`,
      },
    });
    setBusy(false);
    if (authError) return setError(authError.message);
    setSubmitted(true);
  }
  if (submitted)
    return (
      <AuthFrame
        eyebrow="Account ready"
        title="Check your email"
        description="Confirm your email address to finish creating your account."
      >
        <div className="border-t border-white/12 pt-7">
          <CheckCircle2 className="size-7 text-white" />
          <p className="mt-4 text-sm leading-6 text-white/55">
            After confirming your email, sign in and your account will wait for owner approval.
          </p>
          <Link
            href="/login"
            className="mt-7 flex items-center gap-2 text-sm text-white"
          >
            Continue to sign in <ArrowRight className="size-4" />
          </Link>
        </div>
      </AuthFrame>
    );
  return (
    <AuthFrame
      eyebrow="New members"
      title="Create your account"
      description="Register with your own email address. Access begins after owner approval."
    >
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorMessage message={error} />}
        <label className={labelClass}>
          Full name
          <input name="fullName" required className={fieldClass} />
        </label>
        <label className={labelClass}>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className={fieldClass}
          />
        </label>
        <label className={labelClass}>
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
            className={fieldClass}
          />
        </label>
        <button disabled={busy} className={buttonClass}>
          {busy ? "Creating account…" : "Create account"}
          <ArrowRight className="size-4" />
        </button>
      </form>
      <p className="mt-7 text-center text-xs text-white/35">
        Already registered?{" "}
        <Link href="/login" className="text-white">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      String(form.get("email")).trim(),
      { redirectTo: `${window.location.origin}/reset-password` },
    );
    if (authError) setError(authError.message);
    else setSent(true);
  }
  return (
    <AuthFrame
      eyebrow="Account recovery"
      title="Reset your password"
      description="We will send a secure reset link to your registered email."
    >
      {sent ? (
        <div>
          <CheckCircle2 className="size-7" />
          <p className="mt-4 text-sm text-white/50">
            Check your inbox for the reset link.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {error && <ErrorMessage message={error} />}
          <label className={labelClass}>
            Email
            <input name="email" type="email" required className={fieldClass} />
          </label>
          <button className={buttonClass}>Send reset link</button>
        </form>
      )}
      <Link
        href="/login"
        className="mt-7 flex items-center gap-2 text-xs text-white/45"
      >
        <ArrowLeft className="size-3" />
        Back to sign in
      </Link>
    </AuthFrame>
  );
}

export function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 10) return setError("Use at least 10 characters.");
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) setError(authError.message);
    else setLocation("/dashboard");
  }
  return (
    <AuthFrame
      eyebrow="Secure your account"
      title="Choose a new password"
      description="Your new password must contain at least 10 characters."
    >
      <form onSubmit={submit} className="space-y-5">
        {error && <ErrorMessage message={error} />}
        <label className={labelClass}>
          New password
          <input
            name="password"
            type="password"
            minLength={10}
            required
            className={fieldClass}
          />
        </label>
        <button className={buttonClass}>Save new password</button>
      </form>
    </AuthFrame>
  );
}

export function PendingPage({ status = "pending" }: { status?: "pending" | "rejected" | "suspended" }) {
  const { session, profile, signOut, loading } = useAuth();
  if (!loading && !session) return <Redirect to="/login" />;
  if (!loading && profile?.status === "active")
    return <Redirect to="/dashboard" />;
  return (
    <AuthFrame
      eyebrow={status === "suspended" ? "Access suspended" : status === "rejected" ? "Access declined" : "Approval pending"}
      title={status === "pending" ? "Your account is being reviewed" : "Contact the owner"}
      description={
        status === "suspended"
          ? "Your membership access has been suspended. Contact TheTradersCartel for assistance."
          : status === "rejected"
            ? "Your membership request was not approved. Contact TheTradersCartel if you believe this is a mistake."
            : "Your email is verified. The owner will review and activate your membership."
      }
    >
      <div className="border-t border-white/12 pt-7">
        <p className="text-sm text-white/55">{profile?.email}</p>
        <button
          onClick={() => signOut()}
          className="mt-7 border border-white/15 px-5 py-3 text-xs uppercase tracking-wider text-white/60 hover:border-white/40 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </AuthFrame>
  );
}
