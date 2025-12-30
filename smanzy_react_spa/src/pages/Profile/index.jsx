import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import Button from '@/components/Button';
import { formatDate } from '@/utils/dateFormat';
import styles from './index.module.scss';
import clsx from 'clsx';

const ProfileField = ({ label, name, value, type = "text", highlight = false, isEditing, onChange, inputSize = 'default' }) => (
    <div className={clsx(styles.field, highlight && styles.alt)}>
        <dt className={styles.label}>{label}</dt>
        <dd className={styles.value}>
            {isEditing ? (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={clsx(styles.input, styles[`input${inputSize}`])}
                />
            ) : (
                value || <span className={styles.italic}>Not set</span>
            )}
        </dd>
    </div>
);

export default function Profile() {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);

    const { isPending, error, data } = useQuery({
        queryKey: ['profile'],
        queryFn: () => api.get('/profile').then((res) => res.data),
        retry: false,
    });


    const updateProfileMutation = useMutation({
        mutationFn: (updatedData) => {
            return api.put('/profile', updatedData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setIsEditing(false);
        },
        onError: (err) => {
            alert('Failed to update profile: ' + (err.response?.data?.error || err.message));
        }
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const currentData = formData || {
            name: data.data.name || '',
            tel: data.data.tel || '',
            age: data.data.age || 0,
            address: data.data.address || '',
            city: data.data.city || '',
            country: data.data.country || '',
            gender: data.data.gender || ''
        };
        setFormData({
            ...currentData,
            [name]: name === 'age' ? parseInt(value) || 0 : value
        });
    };

    const handleSave = () => {
        if (formData) {
            updateProfileMutation.mutate(formData);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData(null);
    };

    if (isPending) return <div className={styles.loading}>Loading profile...</div>;

    if (error) return (
        <div className={styles.error}>
            Error loading profile: {error.message}
        </div>
    );


    const user = data.data;
    const currentFormData = formData || {
        name: user.name || '',
        tel: user.tel || '',
        age: user.age || 0,
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        gender: user.gender || ''
    };

    return (
        <div className={styles.profileCard}>
            <div className={styles.header}>
                <div>
                    <h3 className={styles.title}>User Profile</h3>
                    <p className={styles.subtitle}>Personal details and application role.</p>
                </div>
                <div className={styles.actions}>
                    {!isEditing ? (
                        <Button
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={handleCancel}
                                variant="secondary"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={updateProfileMutation.isPending}
                            >
                                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    )}
                </div>
            </div>
            <div className={styles.content}>
                <dl>
                    <ProfileField label="Full name" name="name" value={currentFormData.name} highlight isEditing={isEditing} onChange={handleInputChange} inputSize="Lg" />
                    <div className={styles.field}>
                        <dt className={styles.label}>Email address</dt>
                        <dd className={styles.value}>{user.email}</dd>
                    </div>
                    <ProfileField label="Telephone" name="tel" value={currentFormData.tel} highlight isEditing={isEditing} onChange={handleInputChange} inputSize="Md" />
                    <ProfileField label="Age" name="age" value={currentFormData.age} type="number" isEditing={isEditing} onChange={handleInputChange} inputSize="Sm" />
                    <ProfileField label="Gender" name="gender" value={currentFormData.gender} highlight isEditing={isEditing} onChange={handleInputChange} inputSize="Md" />
                    <ProfileField label="Address" name="address" value={currentFormData.address} isEditing={isEditing} onChange={handleInputChange} inputSize="Lg" />
                    <ProfileField label="City" name="city" value={currentFormData.city} highlight isEditing={isEditing} onChange={handleInputChange} inputSize="Md" />
                    <ProfileField label="Country" name="country" value={currentFormData.country} isEditing={isEditing} onChange={handleInputChange} inputSize="Md" />

                    <div className={clsx(styles.field, styles.alt)}>
                        <dt className={styles.label}>Roles</dt>
                        <dd className={styles.value}>
                            <div className={styles.rolesList}>
                                {user.roles && user.roles.map(r => (
                                    <span key={r.id} className={styles.rolePill}>
                                        {r.name}
                                    </span>
                                ))}
                            </div>
                        </dd>
                    </div>
                    <div className={styles.field}>
                        <dt className={styles.label}>Member since</dt>
                        <dd className={styles.value}>
                            {formatDate(user.created_at)}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
