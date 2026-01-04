import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Trash2, Key, UserCog, RotateCcw, X, Shield } from 'lucide-react';

import api from '@/services/api';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import Panel from '@/components/Panel';
import Modal from '@/components/Modal';
import { formatDate } from '@/utils/dateFormat';
import styles from './index.module.scss';
import clsx from 'clsx';

export default function UserManagement() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const [showDeleted, setShowDeleted] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [resetPasswordUserId, setResetPasswordUserId] = useState(null);
    const [managingRolesUserId, setManagingRolesUserId] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [editFormData, setEditFormData] = useState({});
    const [newRoleName, setNewRoleName] = useState('');

    const page = parseInt(searchParams.get('page')) || 1;
    const limit = 10;

    // Fetch current user to check admin status
    const { data: currentUserData } = useQuery({
        queryKey: ['profile'],
        queryFn: () => api.get('/profile').then((res) => res.data),
        retry: false,
    });

    const currentUser = currentUserData?.data;
    const isAdmin = currentUser?.roles?.some((r) => r.name === 'admin');

    // Redirect if not admin
    if (currentUser && !isAdmin) {
        navigate('/');
        return null;
    }

    // Fetch users (with or without deleted)
    const { isPending, error, data } = useQuery({
        queryKey: ['users', showDeleted],
        queryFn: () => {
            const endpoint = showDeleted ? '/users/deleted' : '/users';
            return api.get(endpoint).then((res) => res.data);
        },
        enabled: isAdmin,
        retry: false,
    });

    // Update user mutation
    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setEditingUserId(null);
            setEditFormData({});
        },
        onError: (err) => {
            alert('Failed to update user: ' + (err.response?.data?.error || err.message));
        },
    });

    // Delete user mutation
    const deleteUserMutation = useMutation({
        mutationFn: (id) => api.delete(`/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (err) => {
            alert('Failed to delete user: ' + (err.response?.data?.error || err.message));
        },
    });

    // Restore user mutation
    const restoreUserMutation = useMutation({
        mutationFn: (id) => api.post(`/users/${id}/restore`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            alert('User restored successfully!');
        },
        onError: (err) => {
            alert('Failed to restore user: ' + (err.response?.data?.error || err.message));
        },
    });

    // Reset password mutation
    const resetPasswordMutation = useMutation({
        mutationFn: ({ id, password }) => api.put(`/users/${id}/password`, { new_password: password }),
        onSuccess: () => {
            alert('Password reset successfully!');
            setResetPasswordUserId(null);
            setNewPassword('');
        },
        onError: (err) => {
            alert('Failed to reset password: ' + (err.response?.data?.error || err.message));
        },
    });

    // Assign role mutation
    const assignRoleMutation = useMutation({
        mutationFn: ({ userId, roleName }) => api.post(`/users/${userId}/roles`, { role_name: roleName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setNewRoleName('');
        },
        onError: (err) => {
            alert('Failed to assign role: ' + (err.response?.data?.error || err.message));
        },
    });

    // Remove role mutation
    const removeRoleMutation = useMutation({
        mutationFn: ({ userId, roleName }) => api.delete(`/users/${userId}/roles`, { data: { role_name: roleName } }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (err) => {
            alert('Failed to remove role: ' + (err.response?.data?.error || err.message));
        },
    });

    const handleEdit = (user) => {
        setEditingUserId(user.id);
        setEditFormData({
            name: user.name || '',
            tel: user.tel || '',
            age: user.age || 0,
            address: user.address || '',
            city: user.city || '',
            country: user.country || '',
            gender: user.gender || '',
        });
    };

    const handleEditSubmit = () => {
        if (editingUserId) {
            updateUserMutation.mutate({ id: editingUserId, data: editFormData });
        }
    };

    const handleDelete = (user) => {
        if (window.confirm(`Are you sure you want to delete user "${user.name}" (${user.email})?`)) {
            deleteUserMutation.mutate(user.id);
        }
    };

    const handleRestore = (user) => {
        if (window.confirm(`Restore user "${user.name}" (${user.email})?`)) {
            restoreUserMutation.mutate(user.id);
        }
    };

    const handleResetPassword = () => {
        if (resetPasswordUserId && newPassword) {
            if (newPassword.length < 8) {
                alert('Password must be at least 8 characters long');
                return;
            }
            resetPasswordMutation.mutate({ id: resetPasswordUserId, password: newPassword });
        }
    };

    const handleAssignRole = () => {
        if (managingRolesUserId && newRoleName.trim()) {
            assignRoleMutation.mutate({ userId: managingRolesUserId, roleName: newRoleName.trim().toLowerCase() });
        }
    };

    const handleRemoveRole = (roleName) => {
        if (managingRolesUserId && window.confirm(`Remove role "${roleName}"?`)) {
            removeRoleMutation.mutate({ userId: managingRolesUserId, roleName });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({
            ...editFormData,
            [name]: name === 'age' ? parseInt(value) || 0 : value,
        });
    };

    const isUserDeleted = (user) => {
        return user.deleted_at && user.deleted_at !== 0;
    };

    if (!currentUser) {
        return (
            <div className={styles.loadingSpinner}>
                <div className="text-center">
                    <div className={styles.spinner}></div>
                    <p className={styles.textSecondary}>Loading...</p>
                </div>
            </div>
        );
    }

    if (isPending) {
        return (
            <div className={styles.loadingSpinner}>
                <div className="text-center">
                    <div className={styles.spinner}></div>
                    <p className={styles.textSecondary}>Loading users...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorBox}>
                    <p className={styles.errorTitle}>Error loading users</p>
                    <p className={styles.errorMessage}>{error.message}</p>
                </div>
            </div>
        );
    }

    const users = data?.data || [];
    const totalUsers = users.length;

    // Derived state
    const editingUser = users.find((u) => u.id === editingUserId);
    const resetPasswordUser = users.find((u) => u.id === resetPasswordUserId);
    const managingRolesUser = users.find((u) => u.id === managingRolesUserId);

    // Client-side pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);
    const totalPages = Math.ceil(totalUsers / limit);

    const handlePageChange = (newPage) => {
        setSearchParams({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>User Management</h1>
                    <p className={styles.subtitle}>
                        Manage users, roles, and permissions
                    </p>
                </div>
            </div>

            {/* Users List */}
            <Panel>
                <div className={styles.tableHeader}>
                    <div>
                        <h2 className={styles.sectionTitle}>
                            {showDeleted ? 'All Users (Including Deleted)' : 'Active Users'}
                        </h2>
                        <p className={styles.tableInfo}>
                            Showing {paginatedUsers.length} of {totalUsers} users
                        </p>
                    </div>
                    {totalPages > 1 && (
                        <div className={styles.textSecondary}>
                            Page {page} of {totalPages}
                        </div>
                    )}
                    <div className={styles.headerActions}>
                        <Button
                            onClick={() => setShowDeleted(!showDeleted)}
                            variant={showDeleted ? 'primary' : 'secondary'}
                            size="sm"
                        >
                            {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
                        </Button>
                    </div>
                </div>

                {paginatedUsers.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👥</div>
                        <p className={styles.emptyText}>No users found</p>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead className={styles.thead}>
                                <tr>
                                    <th className={styles.th}>User</th>
                                    <th className={styles.th}>Roles</th>
                                    <th className={styles.th}>Contact</th>
                                    <th className={styles.th}>Joined</th>
                                    <th className={clsx(styles.th, styles.right)}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className={styles.tbody}>
                                {paginatedUsers.map((user) => {
                                    const deleted = isUserDeleted(user);
                                    return (
                                        <tr key={user.id} className={clsx(styles.tr, deleted && styles.deletedRow)}>
                                            <td className={styles.td}>
                                                <div className={styles.userName}>
                                                    {user.name}
                                                    {deleted && <span className={styles.deletedBadge}>Deleted</span>}
                                                </div>
                                                <div className={styles.userEmail}>{user.email}</div>
                                            </td>
                                            <td className={styles.td}>
                                                <div className={styles.rolesList}>
                                                    {user.roles && user.roles.map((role) => (
                                                        <span key={role.id} className={styles.rolePill}>
                                                            {role.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className={clsx(styles.td, styles.textSecondary)}>
                                                <div>{user.tel || 'N/A'}</div>
                                                <div className={styles.userLocation}>
                                                    {user.city && user.country ? `${user.city}, ${user.country}` : user.city || user.country || 'N/A'}
                                                </div>
                                            </td>
                                            <td className={clsx(styles.td, styles.textSecondary)}>
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className={clsx(styles.td, styles.right)}>
                                                <div className="flex justify-end gap-2">
                                                    {deleted ? (
                                                        <IconButton
                                                            onClick={() => handleRestore(user)}
                                                            title="Restore User"
                                                        >
                                                            <RotateCcw />
                                                        </IconButton>
                                                    ) : (
                                                        <>
                                                            <IconButton
                                                                onClick={() => handleEdit(user)}
                                                                title="Edit User"
                                                            >
                                                                <Edit />
                                                            </IconButton>
                                                            <IconButton
                                                                onClick={() => setManagingRolesUserId(user.id)}
                                                                title="Manage Roles"
                                                            >
                                                                <UserCog />
                                                            </IconButton>
                                                            <IconButton
                                                                onClick={() => setResetPasswordUserId(user.id)}
                                                                title="Reset Password"
                                                            >
                                                                <Key />
                                                            </IconButton>
                                                            <IconButton
                                                                onClick={() => handleDelete(user)}
                                                                title="Delete User"
                                                                disabled={user.id === currentUser?.id}
                                                            >
                                                                <Trash2 />
                                                            </IconButton>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {paginatedUsers.length > 0 && totalPages > 1 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>
                            Page <span>{page}</span> of <span>{totalPages}</span>
                        </div>
                        <div className={styles.paginationControls}>
                            <Button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                variant="secondary"
                                size="sm"
                            >
                                Previous
                            </Button>

                            <Button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages}
                                variant="secondary"
                                size="sm"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Panel>

            {/* Edit User Modal */}
            <Modal
                isOpen={!!editingUser}
                onClose={() => {
                    setEditingUserId(null);
                    setEditFormData({});
                }}
                title="Edit User"
            >
                <div className={styles.modalContent}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Name</label>
                        <input
                            type="text"
                            name="name"
                            value={editFormData.name || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Telephone</label>
                        <input
                            type="text"
                            name="tel"
                            value={editFormData.tel || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Age</label>
                        <input
                            type="number"
                            name="age"
                            value={editFormData.age || 0}
                            onChange={handleInputChange}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Gender</label>
                        <input
                            type="text"
                            name="gender"
                            value={editFormData.gender || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Address</label>
                        <input
                            type="text"
                            name="address"
                            value={editFormData.address || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>City</label>
                        <input
                            type="text"
                            name="city"
                            value={editFormData.city || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Country</label>
                        <input
                            type="text"
                            name="country"
                            value={editFormData.country || ''}
                            onChange={handleInputChange}
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <Button
                            onClick={() => {
                                setEditingUserId(null);
                                setEditFormData({});
                            }}
                            variant="secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditSubmit}
                            disabled={updateUserMutation.isPending}
                        >
                            {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Manage Roles Modal */}
            <Modal
                isOpen={!!managingRolesUser}
                onClose={() => {
                    setManagingRolesUserId(null);
                    setNewRoleName('');
                }}
                title="Manage User Roles"
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Managing roles for <strong>{managingRolesUser?.name}</strong> ({managingRolesUser?.email})
                    </p>

                    {/* Current Roles */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Current Roles</label>
                        <div className={styles.rolesManagementList}>
                            {managingRolesUser?.roles && managingRolesUser.roles.length > 0 ? (
                                managingRolesUser.roles.map((role) => (
                                    <div key={role.id} className={styles.roleChip}>
                                        <Shield size={14} />
                                        <span>{role.name}</span>
                                        <button
                                            onClick={() => handleRemoveRole(role.name)}
                                            className={styles.removeRoleBtn}
                                            title="Remove role"
                                            disabled={removeRoleMutation.isPending}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.noRoles}>No roles assigned</p>
                            )}
                        </div>
                    </div>

                    {/* Add New Role */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Add Role</label>
                        <div className={styles.addRoleContainer}>
                            <input
                                type="text"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                className={styles.input}
                                placeholder="Enter role name (e.g., admin, user)"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAssignRole();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleAssignRole}
                                disabled={assignRoleMutation.isPending || !newRoleName.trim()}
                                size="sm"
                            >
                                {assignRoleMutation.isPending ? 'Adding...' : 'Add'}
                            </Button>
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <Button
                            onClick={() => {
                                setManagingRolesUserId(null);
                                setNewRoleName('');
                            }}
                            variant="secondary"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                isOpen={!!resetPasswordUser}
                onClose={() => {
                    setResetPasswordUserId(null);
                    setNewPassword('');
                }}
                title="Reset Password"
            >
                <div className={styles.modalContent}>
                    <p className={styles.modalDescription}>
                        Reset password for <strong>{resetPasswordUser?.name}</strong> ({resetPasswordUser?.email})
                    </p>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>New Password (min 8 characters)</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={styles.input}
                            placeholder="Enter new password"
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <Button
                            onClick={() => {
                                setResetPasswordUserId(null);
                                setNewPassword('');
                            }}
                            variant="secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleResetPassword}
                            disabled={resetPasswordMutation.isPending || !newPassword}
                        >
                            {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
