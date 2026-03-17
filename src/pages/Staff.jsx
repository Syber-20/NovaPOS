import { useState } from 'react';
import { Users, UserPlus, Trash2, ShieldCheck, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ROLES = ['owner', 'manager', 'cashier', 'inventory', 'customer'];

export default function Staff() {
  const { users, currentUser, updateUserRole, deleteUser } = useApp();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (uid, newRole) => {
    try {
      if (uid === currentUser.uid) {
        alert("You cannot change your own role.");
        return;
      }
      await updateUserRole(uid, newRole);
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update user role.");
    }
  };

  const handleDelete = async () => {
    try {
      if (confirmDelete === currentUser.uid) {
        alert("You cannot delete yourself.");
        setConfirmDelete(null);
        return;
      }
      await deleteUser(confirmDelete);
      setConfirmDelete(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
            <Users size={24} />
          </div>
          <div>
            <h2>Staff Management</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage system access levels and roles</p>
          </div>
        </div>
      </div>

      {/* Search & Stats */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 280 }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search staff by name or email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="card" style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>{users.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
            Total<br/>Registered
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User Detail</th>
                <th>Current Role</th>
                <th>Access Level</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td>
                      <select 
                        className="input" 
                        style={{ padding: '0.3rem 0.5rem', width: 'auto', fontSize: '0.85rem' }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === currentUser.uid}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'owner' ? 'badge-primary' : u.role === 'manager' ? 'badge-success' : u.role === 'customer' ? 'badge-secondary' : 'badge-warning'}`}>
                        {u.role === 'owner' ? 'Elite Access' : u.role === 'customer' ? 'Limited' : 'Operational'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => setConfirmDelete(u.id)}
                          disabled={u.id === currentUser.uid}
                          title="Remove user access"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>Remove Access</h3>
              <button className="modal-close-btn" onClick={() => setConfirmDelete(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove access for <strong>{users.find(u => u.id === confirmDelete)?.name}</strong>?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>They will no longer be able to log in or access the system.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Confirm Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
