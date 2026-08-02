import { FormEvent, useState } from "react";
import { Check, FileCheck2, KeyRound, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MemberLayout } from "@/components/member/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts } from "@/hooks/use-member-data";
import { supabase } from "@/lib/supabase";
import { currencySchema, tradingAccountSchema } from "@shared/member";
import type { BalanceVerification } from "@/lib/member-types";

const input =
  "mt-2 h-11 w-full border border-white/[0.11] bg-black px-3 text-sm outline-none focus:border-white/40";
const label =
  "text-[9px] font-semibold uppercase tracking-[0.17em] text-white/35";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useAccounts(profile?.id);
  const [accountOpen, setAccountOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: verifications = [] } = useQuery({
    queryKey: ["verifications", profile?.id],
    enabled: Boolean(profile),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("balance_verifications")
        .select("*")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BalanceVerification[];
    },
  });
  const primary = accounts.find((account) => account.is_primary);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: String(form.get("fullName")).trim(),
        timezone: String(form.get("timezone")),
      })
      .eq("id", profile!.id);
    if (error) setMessage(error.message);
    else {
      await refreshProfile();
      setMessage("Profile updated.");
    }
  }
  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmation"));
    if (password.length < 10)
      return setMessage("Use at least 10 characters for your password.");
    if (password !== confirmation)
      return setMessage("The password confirmation does not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      (event.currentTarget as HTMLFormElement).reset();
      setMessage("Password updated successfully.");
    }
  }
  async function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const parsed = tradingAccountSchema.safeParse({
      name: form.get("name"),
      broker: form.get("broker"),
      currency: form.get("currency"),
      startingBalance: form.get("startingBalance"),
      isPrimary: accounts.length === 0 || form.get("isPrimary") === "on",
    });
    if (!parsed.success)
      return setMessage(
        parsed.error.issues[0]?.message || "Check the account details.",
      );
    setBusy(true);
    if (parsed.data.isPrimary)
      await supabase
        .from("trading_accounts")
        .update({ is_primary: false })
        .eq("user_id", profile!.id);
    const { error } = await supabase
      .from("trading_accounts")
      .insert({
        user_id: profile!.id,
        name: parsed.data.name,
        broker: parsed.data.broker || null,
        currency: parsed.data.currency,
        starting_balance: parsed.data.startingBalance,
        current_balance: parsed.data.startingBalance,
        is_primary: parsed.data.isPrimary,
      });
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setAccountOpen(false);
      setMessage("Trading account created.");
    }
  }
  async function setPrimary(id: string) {
    setMessage("");
    const current = accounts.find((account) => account.id === id);
    if (current?.is_primary) return;
    await supabase
      .from("trading_accounts")
      .update({ is_primary: false })
      .eq("user_id", profile!.id);
    const { error } = await supabase
      .from("trading_accounts")
      .update({ is_primary: true })
      .eq("id", id);
    if (error) setMessage(error.message);
    else {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setMessage("Primary account updated.");
    }
  }
  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!primary) return;
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const balance = Number(form.get("balance"));
    const proof = form.get("proof") as File;
    if (!Number.isFinite(balance) || balance < 0) {
      setBusy(false);
      return setMessage("Enter a valid positive balance.");
    }
    if (
      !proof ||
      proof.size === 0 ||
      proof.size > 10 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
        proof.type,
      )
    ) {
      setBusy(false);
      return setMessage("Proof must be JPG, PNG, WebP or PDF and under 10 MB.");
    }
    const path = `${profile!.id}/${primary.id}/${crypto.randomUUID()}-${proof.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const upload = await supabase.storage
      .from("verification-proofs")
      .upload(path, proof);
    if (upload.error) {
      setBusy(false);
      return setMessage(upload.error.message);
    }
    let rate: number | null = primary.currency === "ZAR" ? 1 : null;
    if (!rate) {
      try {
        const response = await fetch(
          `https://api.frankfurter.app/latest?from=${primary.currency}&to=ZAR`,
        );
        const json = await response.json();
        rate = Number(json?.rates?.ZAR) || null;
      } catch {
        rate = null;
      }
    }
    const { error } = await supabase
      .from("balance_verifications")
      .insert({
        account_id: primary.id,
        user_id: profile!.id,
        submitted_balance: balance,
        currency: currencySchema.parse(primary.currency),
        fx_rate_to_zar: rate,
        zar_equivalent: rate ? balance * rate : null,
        proof_path: path,
      });
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      await queryClient.invalidateQueries({ queryKey: ["verifications"] });
      setMessage(
        rate
          ? "Balance proof submitted for approval."
          : "Proof submitted. An administrator will enter the ZAR equivalent.",
      );
      (event.currentTarget as HTMLFormElement).reset();
    }
  }

  return (
    <MemberLayout>
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
          Account
        </p>
        <h1 className="mt-3 font-sans text-3xl font-semibold normal-case tracking-[-0.04em]">
          Settings
        </h1>
        <p className="mt-2 text-sm text-white/38">
          Manage your identity, trading accounts and group verification.
        </p>
      </div>
      {message && (
        <p className="mt-6 border-l border-white/35 pl-3 text-xs text-white/55">
          {message}
        </p>
      )}
      <div className="mt-10 grid gap-12 xl:grid-cols-2 xl:gap-16">
        <section>
          <h2 className="font-sans text-base font-semibold normal-case tracking-normal">
            Profile
          </h2>
          <form
            onSubmit={updateProfile}
            className="mt-6 grid gap-4 sm:grid-cols-2"
          >
            <label className={`${label} sm:col-span-2`}>
              Full name
              <input
                name="fullName"
                required
                defaultValue={profile?.full_name}
                className={input}
              />
            </label>
            <label className={`${label} sm:col-span-2`}>
              Email
              <input
                value={profile?.email || ""}
                disabled
                className={`${input} opacity-50`}
              />
            </label>
            <label className={`${label} sm:col-span-2`}>
              Timezone
              <input
                name="timezone"
                defaultValue={profile?.timezone}
                className={input}
              />
            </label>
            <button className="mt-2 h-11 bg-white px-5 text-xs font-semibold text-black sm:col-span-2">
              Save profile
            </button>
          </form>
        </section>
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sans text-base font-semibold normal-case tracking-normal">
                Trading accounts
              </h2>
              <p className="mt-1 text-xs text-white/30">
                Each currency keeps separate analytics.
              </p>
            </div>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="grid size-9 place-items-center border border-white/12"
            >
              <Plus className="size-4" />
            </button>
          </div>
          {accountOpen && (
            <form
              onSubmit={addAccount}
              className="mt-5 grid gap-4 border-y border-white/10 py-5 sm:grid-cols-2"
            >
              <label className={label}>
                Account name
                <input
                  name="name"
                  placeholder="Funded account"
                  required
                  className={input}
                />
              </label>
              <label className={label}>
                Broker
                <input name="broker" className={input} />
              </label>
              <label className={label}>
                Currency
                <input
                  name="currency"
                  defaultValue="USD"
                  maxLength={3}
                  required
                  className={input}
                />
              </label>
              <label className={label}>
                Starting balance
                <input
                  name="startingBalance"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className={input}
                />
              </label>
              {accounts.length > 0 && (
                <label className="flex items-center gap-2 text-xs text-white/50 sm:col-span-2">
                  <input name="isPrimary" type="checkbox" />
                  Make this my primary account
                </label>
              )}
              <button
                disabled={busy}
                className="h-10 bg-white text-xs font-semibold text-black sm:col-span-2"
              >
                Create account
              </button>
            </form>
          )}
          <div className="mt-5 divide-y divide-white/[0.07]">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p className="text-sm">{account.name}</p>
                  <p className="mt-1 text-[10px] text-white/30">
                    {account.broker || "No broker"} · {account.currency} ·{" "}
                    {Number(account.current_balance).toLocaleString()}
                  </p>
                </div>
                {account.is_primary ? (
                  <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-white/45">
                    <Check className="size-3" />
                    Primary
                  </span>
                ) : (
                  <button
                    onClick={() => setPrimary(account.id)}
                    className="text-[10px] text-white/35 hover:text-white"
                  >
                    Make primary
                  </button>
                )}
              </div>
            ))}
            {accounts.length === 0 && (
              <p className="py-6 text-sm text-white/30">
                No trading accounts yet.
              </p>
            )}
          </div>
        </section>
      </div>
      <section className="mt-14 border-t border-white/[0.08] pt-9">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <KeyRound className="size-6 text-white/50" />
            <h2 className="mt-4 font-sans text-lg font-semibold normal-case tracking-normal">
              Password
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/38">
              Change your member password without using an email reset link.
            </p>
          </div>
          <form onSubmit={updatePassword} className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              New password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                required
                className={input}
              />
            </label>
            <label className={label}>
              Confirm password
              <input
                name="confirmation"
                type="password"
                autoComplete="new-password"
                minLength={10}
                required
                className={input}
              />
            </label>
            <button
              disabled={busy}
              className="h-11 bg-white text-xs font-semibold text-black sm:col-span-2"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </section>
      <section className="mt-14 border-t border-white/[0.08] pt-9">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <FileCheck2 className="size-6 text-white/50" />
            <h2 className="mt-4 font-sans text-lg font-semibold normal-case tracking-normal">
              Balance verification
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/38">
              Your approved primary account balance determines access to Group
              1, 2 or 3. Journal results never move your group.
            </p>
            {profile?.group_no && (
              <p className="mt-5 text-xs text-white/65">
                Current access: Group {profile.group_no}
              </p>
            )}
          </div>
          <div>
            {primary ? (
              <form
                onSubmit={submitVerification}
                className="grid gap-4 sm:grid-cols-2"
              >
                <label className={label}>
                  Primary account
                  <input
                    value={`${primary.name} · ${primary.currency}`}
                    disabled
                    className={`${input} opacity-50`}
                  />
                </label>
                <label className={label}>
                  Current broker balance
                  <input
                    name="balance"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className={input}
                  />
                </label>
                <label className={`${label} sm:col-span-2`}>
                  Broker proof
                  <input
                    name="proof"
                    type="file"
                    required
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="mt-2 block w-full text-xs text-white/40 file:mr-3 file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
                  />
                </label>
                <button
                  disabled={busy}
                  className="h-11 bg-white text-xs font-semibold text-black sm:col-span-2"
                >
                  {busy ? "Submitting…" : "Submit for approval"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-white/35">
                Create and select a primary trading account first.
              </p>
            )}
            <div className="mt-7 divide-y divide-white/[0.07]">
              {verifications.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between py-3 text-xs"
                >
                  <span className="text-white/45">
                    {Number(item.submitted_balance).toLocaleString()}{" "}
                    {item.currency}
                  </span>
                  <span
                    className={
                      item.status === "approved"
                        ? "text-white"
                        : "text-white/35"
                    }
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </MemberLayout>
  );
}
