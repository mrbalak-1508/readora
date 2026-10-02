"use client";

import React, { useState, useEffect } from "react";
import { UserRole } from "@/lib/types";
import { ShieldCheck, User, Search, RefreshCw, CheckCircle, Ban, ShieldAlert } from "lucide-react";
import { showSuccessAlert, showErrorAlert, showConfirmAlert, showToastAlert } from "@/lib/alerts";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  joined: string;
  booksRead: number;
  lastActive: string;
  role: "admin" | "user";
  status: "active" | "suspended";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        }
      }
    } catch (err) {
      console.error("Failed to load users:", err);
      showErrorAlert("Directory Error", "Failed to retrieve registered users from SQLite.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleRole = async (u: AdminUserRow) => {
    const nextRole = u.role === "admin" ? "user" : "admin";
    const isDemotion = nextRole === "user";

    const confirmed = await showConfirmAlert(
      isDemotion ? "Revoke Admin Privileges?" : "Grant Admin Privileges?",
      `Are you sure you want to change ${u.name}'s role to ${nextRole.toUpperCase()}? ${
        isDemotion
          ? "This will remove access to the publishing studio and SQLite manager."
          : "This will grant complete management access over library catalog and database."
      }`,
      isDemotion ? "Revoke Privileges" : "Grant Privileges",
      "Cancel",
      isDemotion
    );

    if (!confirmed) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, role: nextRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update role in database");
      }

      setUsers((prev) =>
        prev.map((row) => (row.id === u.id ? { ...row, role: nextRole } : row))
      );
      showSuccessAlert("Role Updated", `${u.name} is now registered as ${nextRole.toUpperCase()}.`);
    } catch (err: any) {
      showErrorAlert("Update Failed", err.message || "Could not persist role change.");
    }
  };

  const toggleStatus = async (u: AdminUserRow) => {
    const nextStatus = u.status === "active" ? "suspended" : "active";
    const isSuspending = nextStatus === "suspended";

    const confirmed = await showConfirmAlert(
      isSuspending ? "Suspend Reader Account?" : "Activate Reader Account?",
      `Are you sure you want to ${isSuspending ? "suspend" : "reactivate"} ${u.name}'s account?`,
      isSuspending ? "Suspend Account" : "Activate Account",
      "Cancel",
      isSuspending
    );

    if (!confirmed) return;

    setUsers((prev) =>
      prev.map((row) => (row.id === u.id ? { ...row, status: nextStatus } : row))
    );

    showToastAlert(`Account status updated to ${nextStatus}`, isSuspending ? "warning" : "success");
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
              Access Governance
            </span>
            <span className="text-xs text-[var(--muted)]">Prisma SQLite Authenticated</span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)]">
            User Directory & Roles
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Audit reader accounts, modify authorization roles, and regulate curator credentials.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] text-[var(--foreground)] transition-colors shadow-xs"
          title="Refresh user list"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--primary)]" : ""}`} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by reader name or email address..."
          className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-[var(--card)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] transition-colors"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--background)] text-[var(--muted)] border-b border-[var(--border)] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-4 px-5">Reader Profile</th>
                <th className="py-4 px-4">Role Permission</th>
                <th className="py-4 px-4">Registered</th>
                <th className="py-4 px-4">Books Read</th>
                <th className="py-4 px-4">Last Activity</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--muted)]">
                    No readers matching search query.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--background)]/60 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-[var(--accent-light)] text-[var(--primary)] font-bold flex items-center justify-center text-xs border border-[var(--border)]">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--foreground)]">{u.name}</div>
                          <div className="text-[11px] text-[var(--muted)]">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleRole(u)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                        title="Click to toggle Admin / Reader role"
                      >
                        {u.role === "admin" ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-600" />
                        )}
                        <span>{u.role}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-[var(--muted)]">{u.joined}</td>
                    <td className="py-3.5 px-4 text-[var(--foreground)] font-mono font-bold">{u.booksRead}</td>
                    <td className="py-3.5 px-4 text-[var(--muted)]">{u.lastActive}</td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                          u.status === "active" ? "text-emerald-600" : "text-rose-500"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            u.status === "active" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <span className="capitalize">{u.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => toggleStatus(u)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-semibold border transition-colors ${
                          u.status === "active"
                            ? "border-[var(--border)] text-[var(--muted)] hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                            : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {u.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
