"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  ArrowLeft,
  Server,
  BellRing,
} from "lucide-react";
import { showToastAlert } from "@/lib/alerts";

export default function AdminSmtpSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [form, setForm] = useState({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    fromEmail: "library@readora.library",
    fromName: "READORA Digital Library",
    adminAlertEmail: "admin@readora.library",
    enabled: true,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/email/settings");
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            host: data.host || prev.host,
            port: data.port || prev.port,
            secure: Boolean(data.secure),
            user: data.user || "",
            fromEmail: data.fromEmail || prev.fromEmail,
            fromName: data.fromName || prev.fromName,
            adminAlertEmail: data.adminAlertEmail || prev.adminAlertEmail,
            enabled: data.enabled ?? true,
          }));
        }
      } catch (err) {
        console.error("Failed to load SMTP settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/email/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      showToastAlert({ title: "SMTP Settings Saved", text: "Email configuration updated successfully." });
    } catch (err: any) {
      showToastAlert({ title: "Error", text: err.message, icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      showToastAlert({ title: "Invalid Email", text: "Please enter a valid email address.", icon: "warning" });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: testEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestResult({ success: false, message: data.error || "SMTP test failed" });
      } else {
        setTestResult({
          success: true,
          message: `Test email dispatched successfully! Message ID: ${data.messageId}`,
        });
        showToastAlert({ title: "Email Delivered", text: "Check your inbox for the test message." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Failed to connect to SMTP" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-subtle)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
              SMTP Email Notifications &amp; Alerts
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Manage outgoing mail servers, order receipts, customer notifications, and security alerts.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <form onSubmit={handleSave} className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Server className="w-5 h-5 text-[var(--primary)]" />
              <h2 className="font-bold text-sm text-[var(--foreground)]">Outgoing Mail Server (SMTP)</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  SMTP Host Server
                </label>
                <input
                  type="text"
                  required
                  value={form.host}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Port
                </label>
                <input
                  type="number"
                  required
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="smtp-secure"
                checked={form.secure}
                onChange={(e) => setForm({ ...form, secure: e.target.checked })}
                className="accent-[var(--primary)]"
              />
              <label htmlFor="smtp-secure" className="text-xs text-[var(--foreground)] cursor-pointer select-none">
                Use SSL / TLS Encryption (typically Port 465)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  SMTP Username / Email
                </label>
                <input
                  type="text"
                  value={form.user}
                  onChange={(e) => setForm({ ...form, user: e.target.value })}
                  placeholder="your-email@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  SMTP Password / App Password
                </label>
                <input
                  type="password"
                  value={form.pass}
                  onChange={(e) => setForm({ ...form, pass: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Sender Identity & Alerts */}
          <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <BellRing className="w-5 h-5 text-[var(--coral)]" />
              <h2 className="font-bold text-sm text-[var(--foreground)]">Sender Identity &amp; System Alerts</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  From Display Name
                </label>
                <input
                  type="text"
                  value={form.fromName}
                  onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  From Email Address
                </label>
                <input
                  type="email"
                  value={form.fromEmail}
                  onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Admin Notification &amp; Alert Recipient Email
              </label>
              <input
                type="email"
                value={form.adminAlertEmail}
                onChange={(e) => setForm({ ...form, adminAlertEmail: e.target.value })}
                placeholder="admin@readora.library"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
              />
              <p className="text-[11px] text-[var(--muted)] mt-1">
                Receives automated alerts when books are purchased, webhooks fail, or security anomalies occur.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Save SMTP Configuration</span>
            </button>
          </div>
        </form>

        {/* Live Email Dispatch Tester */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Send className="w-5 h-5 text-[var(--golden)]" />
              <h2 className="font-bold text-sm text-[var(--foreground)]">Test Live SMTP Dispatch</h2>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Verify your SMTP server credentials by sending a live test email with the official READORA brand template.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--foreground)]">
                Recipient Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="youremail@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
              />
            </div>

            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testing || !testEmail}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting &amp; Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Email</span>
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-600"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <span className="font-bold block">
                    {testResult.success ? "Success" : "Connection Failed"}
                  </span>
                  <p className="mt-0.5 text-[11px] leading-relaxed break-words">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Setup Help Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-subtle)]/50 border border-[var(--border)] text-xs text-[var(--muted)] space-y-2">
            <span className="font-bold text-[var(--foreground)] block">Supported Mail Providers</span>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li><strong>Gmail:</strong> Host: <code className="font-mono text-[10px]">smtp.gmail.com</code>, Port: <code className="font-mono text-[10px]">587</code>, use a Google App Password.</li>
              <li><strong>Amazon SES:</strong> Host: <code className="font-mono text-[10px]">email-smtp.*.amazonaws.com</code>, Port: <code className="font-mono text-[10px]">587</code>.</li>
              <li><strong>SendGrid / Brevo:</strong> Host: <code className="font-mono text-[10px]">smtp.sendgrid.net</code>.</li>
              <li><strong>Custom cPanel:</strong> Host: <code className="font-mono text-[10px]">mail.yourdomain.com</code>, Port: <code className="font-mono text-[10px]">465</code> (SSL).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
