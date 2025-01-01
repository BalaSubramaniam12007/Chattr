import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { Pencil, Upload } from 'lucide-react';

const ProfileFormModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    bio: '',
    avatar_url: ''
  });
  const [updating, setUpdating] = useState(false);
  const [editField, setEditField] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      getProfile();
    }
  }, [isOpen]);

  const getProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile({
        username: data.username || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      setUpdating(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar!');
    } finally {
      setUpdating(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          updated_at: new Date().toISOString(),
          ...profile,
          ...updates
        });

      if (error) throw error;
      setProfile(prev => ({ ...prev, ...updates }));
      setEditField(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile!');
    } finally {
      setUpdating(false);
    }
  };

  const getAvatarUrl = () => {
    return profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username || 'User')}&background=random`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-semibold text-gray-800">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 text-2xl transition duration-200"
          >
            ×
          </button>
        </div>
  
        <div className="flex gap-10">
          {/* Left side - Text fields */}
          <div className="flex-1 space-y-8">
            {/* Username field */}
            <div className="bg-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-gray-700">Username</label>
                <button
                  onClick={() => setEditField('username')}
                  className="text-gray-500 hover:text-blue-500 transition duration-200"
                >
                  <Pencil size={18} />
                </button>
              </div>
              {editField === 'username' ? (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-300"
                    placeholder="Enter username"
                  />
                  <button
                    onClick={() => updateProfile({ username: profile.username })}
                    disabled={updating}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition duration-200"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-gray-600">{profile.username || 'No username set'}</p>
              )}
            </div>
  
            {/* Bio field */}
            <div className="bg-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-gray-700">Bio</label>
                <button
                  onClick={() => setEditField('bio')}
                  className="text-gray-500 hover:text-blue-500 transition duration-200"
                >
                  <Pencil size={18} />
                </button>
              </div>
              {editField === 'bio' ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-300"
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                  <button
                    onClick={() => updateProfile({ bio: profile.bio })}
                    disabled={updating}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm self-end transition duration-200"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-gray-600">{profile.bio || 'No bio yet'}</p>
              )}
            </div>
          </div>
  
          {/* Right side - Avatar */}
          <div className="w-72">
            <div className="bg-gray-100 rounded-lg p-5 shadow-sm text-center">
              <div className="mb-5">
                <img
                  src={getAvatarUrl()}
                  alt="Profile"
                  className="w-36 h-36 rounded-full mx-auto shadow-md border-4 border-gray-200"
                />
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                  disabled={updating}
                />
                <label
                  htmlFor="avatar-upload"
                  className="inline-flex items-center gap-3 bg-blue-100 text-blue-600 px-5 py-2 rounded-lg border border-blue-300 hover:bg-blue-200 cursor-pointer transition duration-200"
                >
                  <Upload size={18} />
                  <span>Upload Avatar</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default ProfileFormModal;