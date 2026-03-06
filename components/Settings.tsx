import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from '../lib/AuthContext';
import { Icon } from './ui/Icon';
import {
  uploadAvatar,
  updateAvatarPath,
  changePassword,
  updateUserProfile,
  deleteOldAvatar,
  getAvatarSignedUrl,
  adminResetPassword,
} from '../services/api/profileSettings';
import { getProfiles } from '../services/api/profiles';

export const Settings: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  // Profile form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDisplayUrl, setAvatarDisplayUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Admin password reset state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');

  // Fetch profiles for admin
  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-admin-settings'],
    queryFn: getProfiles,
    enabled: profile?.role === 'admin',
  });

  // Load avatar signed URL when profile changes
  React.useEffect(() => {
    if (profile?.avatar_url && !avatarPreview) {
      if (profile.avatar_url.startsWith('http')) {
        setAvatarDisplayUrl(profile.avatar_url);
      } else {
        getAvatarSignedUrl(profile.avatar_url)
          .then(url => setAvatarDisplayUrl(url))
          .catch(err => {
            console.error('Error loading avatar URL:', err);
            setAvatarDisplayUrl(profile.avatar_url); // Fallback to raw URL instead of null
          });
      }
    }
  }, [profile?.avatar_url, avatarPreview]);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!avatarFile || !user) throw new Error('No file selected');

      // Upload file (returns storage path, not URL)
      const storagePath = await uploadAvatar(user.id, avatarFile);

      // Delete old avatar if exists
      if (profile?.avatar_url && profile.avatar_url !== storagePath) {
        await deleteOldAvatar(profile.avatar_url);
      }

      // Update profile with storage path
      const updatedProfile = await updateAvatarPath(user.id, storagePath);
      return updatedProfile;
    },
    onSuccess: async (updatedProfile) => {
      // Refresh profile in AuthContext with new avatar
      await refreshProfile();

      toast.success('Profile picture updated successfully!');

      // Clear preview and file
      setAvatarFile(null);
      setAvatarPreview(null);
      setUploadingAvatar(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to upload avatar: ${error.message}`);
      setUploadingAvatar(false);
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return updateUserProfile(user.id, { full_name: fullName, email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      return changePassword(newPassword);
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      toast.error(`Failed to change password: ${error.message}`);
    },
  });

  // Admin reset password mutation
  const adminResetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) {
         throw new Error('Please select a user');
      }
      if (adminNewPassword !== adminConfirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (adminNewPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      return adminResetPassword(selectedUserId, adminNewPassword);
    },
    onSuccess: () => {
      toast.success('User password reset successfully!');
      setSelectedUserId('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
    },
    onError: (error: any) => {
      toast.error(`Failed to reset user password: ${error.message}`);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate();
  };

  const handleAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adminResetPasswordMutation.mutate();
  };

  const handleAvatarUpload = () => {
    if (avatarFile) {
      uploadAvatarMutation.mutate();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

      <div className="space-y-6">
        {/* Profile Picture Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Profile Picture</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={avatarPreview || avatarDisplayUrl || 'https://picsum.photos/seed/default/200/200'}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-700"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <Icon
                    path="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    className="w-8 h-8 text-white animate-spin"
                  />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploadingAvatar}
              />
              <label
                htmlFor="avatar-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-5 h-5" />
                Choose Image
              </label>
              {avatarFile && (
                <button
                  onClick={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  className="ml-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Upload'}
                </button>
              )}
              <p className="text-sm text-gray-400 mt-2">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Changing email will require verification
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <input
                type="text"
                value={profile?.role || 'employee'}
                disabled
                className="w-full bg-gray-900 border border-gray-600 text-gray-400 text-sm rounded-lg p-2.5 capitalize cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Contact an admin to change your role
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Icon
                      path="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      className="w-4 h-4 animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon path="M5 13l4 4L19 7" className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                required
                minLength={6}
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-400">Passwords do not match</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={
                  changePasswordMutation.isPending ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Icon
                      path="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      className="w-4 h-4 animate-spin"
                    />
                    Changing...
                  </>
                ) : (
                  <>
                    <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="w-5 h-5" />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Account Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">User ID:</span>
              <span className="text-gray-300 font-mono">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Account Created:</span>
              <span className="text-gray-300">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Sign In:</span>
              <span className="text-gray-300">
                {user?.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Administrative Actions (Admin Only) */}
        {profile?.role === 'admin' && (
          <div className="bg-red-900 bg-opacity-20 rounded-lg p-6 border border-red-800">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" className="w-5 h-5 text-red-500" />
              Administrative Actions
            </h2>
            <form onSubmit={handleAdminPasswordSubmit} className="space-y-4">
              <p className="text-sm text-gray-400">
                As an administrator, you can force reset the password for any user in the system.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 p-2.5"
                  required
                >
                  <option value="" disabled>Select a user to reset password</option>
                  {profiles?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password for User
                </label>
                <input
                  type="password"
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 p-2.5"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-red-500 focus:border-red-500 p-2.5"
                  required
                  minLength={6}
                />
              </div>

              {adminNewPassword && adminConfirmPassword && adminNewPassword !== adminConfirmPassword && (
                <p className="text-sm text-red-400">Passwords do not match</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    adminResetPasswordMutation.isPending ||
                    !selectedUserId ||
                    !adminNewPassword ||
                    !adminConfirmPassword ||
                    adminNewPassword !== adminConfirmPassword
                  }
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {adminResetPasswordMutation.isPending ? (
                    <>
                      <Icon
                        path="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        className="w-4 h-4 animate-spin"
                      />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Icon path="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" className="w-5 h-5" />
                      Force Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
