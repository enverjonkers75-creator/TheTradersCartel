import { FormEvent, useEffect, useState } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, RefreshCw } from "lucide-react";
import { passwordRecoveryLinkDetected, supabase, supabaseConfigured } from "@/lib/supabase";
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

function validatePassword(password: string) {
  if (password.length < 10) return "Use at least 10 characters for your password.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Include an uppercase letter, a lowercase letter and a number.";
  }
  return "";
}

function readableAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "The email or password is incorrect.";
  if (normalized.includes("email not confirmed")) return "Confirm your email before signing in.";
  if (normalized.includes("rate limit")) return "Too many attempts. Wait a few minutes and try again.";
  return message;
}

export function LoginPage() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendBusy, setResendBusy] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const passwordReset = new URLSearchParams(window.location.search).get("reset") === "success";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: String(form.get("password")),
    });
    setBusy(false);
    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) setUnverifiedEmail(email);
      return setError(readableAuthError(authError.message));
    }
    setLocation("/dashboard");
  }

  async function resendConfirmation() {
    if (!unverifiedEmail) return;
    setResendBusy(true);
    setResendSent(false);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: unverifiedEmail,
      options: { emailRedirectTo: `${window.location.origin}/pending` },
    });
    setResendBusy(false);
    if (resendError) return setError(readableAuthError(resendError.message));
    setResendSent(true);
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
        {passwordReset && <p role="status" className="border-l border-emerald-400/60 pl-3 text-xs leading-5 text-emerald-200/80">Password updated. You can sign in with your new password.</p>}
        {error && <ErrorMessage message={error} />}
        {unverifiedEmail && (
          <button type="button" disabled={resendBusy || resendSent} onClick={() => void resendConfirmation()} className="flex items-center gap-2 text-xs text-white/55 transition hover:text-white disabled:opacity-50">
            <RefreshCw className={`size-3.5 ${resendBusy ? "animate-spin" : ""}`} />
            {resendSent ? "Confirmation email sent" : resendBusy ? "Sending confirmation…" : "Resend confirmation email"}
          </button>
        )}
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
    const passwordError = validatePassword(password);
    if (passwordError) {
      setBusy(false);
      return setError(passwordError);
    }
    if (password !== String(form.get("confirmPassword"))) {
      setBusy(false);
      return setError("The passwords do not match.");
    }
    const email = String(form.get("email")).trim().toLowerCase();
    const fullName = String(form.get("fullName")).trim();
    if (fullName.length < 2) {
      setBusy(false);
      return setError("Enter your full name.");
    }
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/pending`,
      },
    });
    setBusy(false);
    if (authError) return setError(readableAuthError(authError.message));
    setSubmitted(true);
  }
  if (submitted)
    return (
      <AuthFrame
        eyebrow="Thank you for joining"
        title="Confirm your email, then wait for approval"
        description="Your account has been created. Check your inbox and confirm your email address so the owner can review your membership."
      >
        <div className="border-t border-white/12 pt-7">
          <CheckCircle2 className="size-7 text-white" />
          <p className="mt-4 text-sm leading-6 text-white/55">
            Thank you. After confirming your email, sign in and you will see the approval waiting page.
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
          <span className="mt-2 block text-[10px] font-normal normal-case tracking-normal text-white/25">10 or more characters with uppercase, lowercase and a number.</span>
        </label>
        <label className={labelClass}>
          Confirm password
          <input
            name="confirmPassword"
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
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      String(form.get("email")).trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` },
    );
    setBusy(false);
    if (authError) setError(readableAuthError(authError.message));
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
            <input name="email" type="email" autoComplete="email" required className={fieldClass} />
          </label>
          <button disabled={busy} className={buttonClass}>{busy ? "Sending reset link…" : "Send reset link"}</button>
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
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validRecovery, setValidRecovery] = useState(passwordRecoveryLinkDetected);

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") setValidRecovery(Boolean(session));
      setChecking(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setValidRecovery((current) => current && Boolean(data.session));
      setChecking(false);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const passwordError = validatePassword(password);
    if (passwordError) {
      setBusy(false);
      return setError(passwordError);
    }
    if (password !== String(form.get("confirmPassword"))) {
      setBusy(false);
      return setError("The passwords do not match.");
    }
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      setBusy(false);
      setError(readableAuthError(authError.message));
      return;
    }
    await supabase.auth.signOut();
    setLocation("/login?reset=success");
  }

  if (checking) return (
    <AuthFrame eyebrow="Account recovery" title="Checking your reset link" description="This will only take a moment.">
      <LoaderCircle className="size-7 animate-spin text-white/55" />
    </AuthFrame>
  );

  if (!validRecovery) return (
    <AuthFrame eyebrow="Reset link unavailable" title="Request a new reset link" description="This password-reset link is invalid, expired or has already been used.">
      <Link href="/forgot-password" className={buttonClass}>Send a new reset link <ArrowRight className="size-4" /></Link>
      <Link href="/login" className="mt-6 flex items-center gap-2 text-xs text-white/45"><ArrowLeft className="size-3" />Back to sign in</Link>
    </AuthFrame>
  );

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
            autoComplete="new-password"
            minLength={10}
            required
            className={fieldClass}
          />
          <span className="mt-2 block text-[10px] font-normal normal-case tracking-normal text-white/25">10 or more characters with uppercase, lowercase and a number.</span>
        </label>
        <label className={labelClass}>
          Confirm new password
          <input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required className={fieldClass} />
        </label>
        <button disabled={busy} className={buttonClass}>{busy ? "Saving password…" : "Save new password"}</button>
      </form>
    </AuthFrame>
  );
}

export function PendingPage({ status = "pending" }: { status?: "pending" | "rejected" | "suspended" }) {
  const { session, profile, signOut, loading, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [checked, setChecked] = useState(false);
  const actualStatus = profile?.status === "rejected" || profile?.status === "suspended" || profile?.status === "pending" ? profile.status : status;

  useEffect(() => {
    if (!session || profile?.status !== "pending") return;
    const timer = window.setInterval(() => void refreshProfile(), 30_000);
    return () => window.clearInterval(timer);
  }, [session, profile?.status, refreshProfile]);

  useEffect(() => {
    if (!session || !profile || profile.status !== "pending") return;
    const notificationKey = `member-owner-notified:${profile.id}`;
    if (window.localStorage.getItem(notificationKey)) return;
    fetch("/api/membership-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: "pending" }),
    }).then((response) => {
      if (response.ok) window.localStorage.setItem(notificationKey, "true");
    }).catch(() => undefined);
  }, [session, profile]);

  async function checkStatus() {
    setRefreshing(true);
    setChecked(false);
    await refreshProfile();
    setRefreshing(false);
    setChecked(true);
  }
  if (!loading && !session) return <Redirect to="/login" />;
  if (!loading && profile?.status === "active")
    return <Redirect to="/dashboard" />;
  return (
    <AuthFrame
      eyebrow={actualStatus === "suspended" ? "Access suspended" : actualStatus === "rejected" ? "Access declined" : "Approval pending"}
      title={actualStatus === "pending" ? "Thank you. Your account is awaiting approval" : "Contact the owner"}
      description={
        actualStatus === "suspended"
          ? "Your membership access has been suspended. Contact TheTradersCartel for assistance."
          : actualStatus === "rejected"
            ? "Your membership request was not approved. Contact TheTradersCartel if you believe this is a mistake."
            : "Your email is verified. The owner has been notified and will review your membership."
      }
    >
      <div className="border-t border-white/12 pt-7">
        <p className="text-sm text-white/55">{profile?.email}</p>
        {actualStatus === "pending" && <>
          <button disabled={refreshing} onClick={() => void checkStatus()} className="mt-7 flex h-11 items-center gap-2 bg-white px-5 text-xs font-semibold uppercase tracking-wider text-black disabled:opacity-50">
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Checking…" : "Check approval status"}
          </button>
          {checked && <p role="status" className="mt-3 text-xs text-white/35">Still awaiting approval. This page also checks automatically.</p>}
        </>}
        <button onClick={() => signOut()} className="mt-5 border border-white/15 px-5 py-3 text-xs uppercase tracking-wider text-white/60 hover:border-white/40 hover:text-white">Sign out</button>
      </div>
    </AuthFrame>
  );
}
