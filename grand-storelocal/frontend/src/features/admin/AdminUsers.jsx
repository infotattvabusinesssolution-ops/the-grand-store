import React, { useEffect, useState } from "react";
import api from '../../api';
import { useAuth } from "../../context/AuthContext";
import { Search, Shield, User as UserIcon, Building2, Trash2, AlertTriangle, X } from "lucide-react";

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);

  const goldText = "text-[#c9a35b]";

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/admin/users`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${userToDelete._id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
      setNotification({
        type: "success",
        message: `User ${userToDelete.name || userToDelete.email} was successfully deleted.`
      });
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      setNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to delete user."
      });
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
      case 'super_admin': return <span className="px-2 py-1 bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/30 rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 w-max"><Shield size={12}/> Admin</span>;
      case 'vendor_active': return <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 w-max"><Building2 size={12}/> Vendor</span>;
      case 'vendor_pending': return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 w-max"><Building2 size={12}/> Pending Vendor</span>;
      default: return <span className="px-2 py-1 bg-white/5 text-white/50 border border-white/10 rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 w-max"><UserIcon size={12}/> Customer</span>;
    }
  };

  const filtered = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
    (u.role && u.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-10">
      <section>
        <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4 leading-tight">
          User <span className={goldText} >Directory</span>
        </h1>
        <p className="text-[var(--color-ivory-muted)] text-lg font-light">
          Manage all registered users on the platform. Total registered: <span className="text-white font-medium">{users.length}</span>
        </p>
      </section>

      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-white/60 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 w-full md:w-96">
        <Search size={16} className="text-[var(--color-ivory-muted)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="bg-transparent text-sm text-white outline-none placeholder:text-white/30 w-full"
        />
      </div>

      <div className="overflow-x-auto bg-[#0a0a0a] border border-white/5 rounded-2xl">
        {loading ? (
          <div className="p-12 text-center text-[var(--color-ivory-muted)] animate-pulse">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-ivory-muted)]">No users found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] bg-black/20">
                <th className="py-4 pl-6 font-semibold">Name</th>
                <th className="py-4 font-semibold">Email</th>
                <th className="py-4 font-semibold">Role</th>
                <th className="py-4 font-semibold">Joined Date</th>
                <th className="py-4 font-semibold">KYC Verified</th>
                <th className="py-4 pr-6 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isPrivileged = ['admin', 'super_admin', 'accountant', 'product_manager'].includes(u.role);
                return (
                  <tr key={u._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pl-6 text-sm text-[var(--color-ivory)] font-serif">{u.name}</td>
                    <td className="py-4 text-sm text-[var(--color-ivory-muted)]">
                      <a href={`mailto:${u.email}`} className="hover:text-[var(--color-gold)] transition-colors underline decoration-white/20 hover:decoration-[var(--color-gold)] underline-offset-4">
                        {u.email}
                      </a>
                    </td>
                    <td className="py-4">{getRoleBadge(u.role)}</td>
                    <td className="py-4 text-xs text-[var(--color-ivory-muted)]">
                      {new Date(u.createdAt).toLocaleDateString("en-ZA")}
                    </td>
                    <td className="py-4 text-xs text-[var(--color-ivory-muted)]">
                      {u.kycVerified ? <span className="text-green-400 font-medium">Yes</span> : "No"}
                    </td>
                    <td className="py-4 pr-6 text-right">
                      {!isPrivileged && (
                        <button
                          onClick={() => setUserToDelete(u)}
                          title="Delete User"
                          className="inline-flex items-center gap-1 p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-xs"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-serif text-white font-medium">Delete User Account</h3>
                <p className="text-xs text-white/50 mt-1">
                  Are you sure you want to delete this user? All associated user records will be permanently removed.
                </p>
              </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-xl p-4 my-4 text-xs space-y-1">
              <div className="text-white/70">
                <span className="text-white/40">Name:</span> <strong className="text-white font-medium">{userToDelete.name}</strong>
              </div>
              <div className="text-white/70">
                <span className="text-white/40">Email:</span> <span className="text-[var(--color-gold)]">{userToDelete.email}</span>
              </div>
              <div className="text-white/70">
                <span className="text-white/40">Role:</span> <span className="capitalize">{userToDelete.role}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-lg shadow-red-900/20 transition-all flex items-center gap-2"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
