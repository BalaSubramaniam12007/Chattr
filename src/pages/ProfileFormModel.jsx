import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import { Pencil, Upload, Loader2, X, Check } from 'lucide-react';

const ProfileFormModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    bio: '',
    avatar_url: ''
  });
  const [updating, setUpdating] = useState(false);
  const [editField, setEditField] = useState(null);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, bio')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile({
        username: data?.username || '',
        bio: data?.bio || '',
        avatar_url: data?.avatar_url || ''
      });
    } catch (error) {
      setErrors({ fetch: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = (username) => {
    if (!username.trim()) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 30) return 'Username must be less than 30 characters';
    return '';
  };

  const validateBio = (bio) => {
    if (bio.length > 500) return 'Bio must be less than 500 characters';
    return '';
  };

  const updateUsername = async (newUsername) => {
    const error = validateUsername(newUsername);
    if (error) {
      setErrors({ username: error });
      return;
    }

    try {
      setUpdating(true);
      setErrors({});
      
      const { data } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();

      const operation = !data ? 
        supabase.from('profiles').insert([{ id: user.id, username: newUsername, updated_at: new Date().toISOString() }]) :
        supabase.from('profiles').update({ username: newUsername, updated_at: new Date().toISOString() }).eq('id', user.id);

      const { error: upsertError } = await operation;
      if (upsertError) throw upsertError;

      setProfile(prev => ({ ...prev, username: newUsername }));
      setEditField(null);
      setSuccess('Username updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ username: 'Failed to update username' });
    } finally {
      setUpdating(false);
    }
  };

  const updateBio = async (newBio) => {
    const error = validateBio(newBio);
    if (error) {
      setErrors({ bio: error });
      return;
    }

    try {
      setUpdating(true);
      setErrors({});

      const { data } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();

      const operation = !data ? 
        supabase.from('profiles').insert([{ id: user.id, bio: newBio, updated_at: new Date().toISOString() }]) :
        supabase.from('profiles').update({ bio: newBio, updated_at: new Date().toISOString() }).eq('id', user.id);

      const { error: upsertError } = await operation;
      if (upsertError) throw upsertError;

      setProfile(prev => ({ ...prev, bio: newBio }));
      setEditField(null);
      setSuccess('Bio updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ bio: 'Failed to update bio' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setErrors({ avatar: 'File size must be less than 5MB' });
        return;
      }

      setUpdating(true);
      setErrors({});

      if (profile.avatar_url) {
        const existingPath = profile.avatar_url.split('/').pop();
        await supabase.storage.from('avatars').remove([existingPath]);
      }

      const fileName = `${user.id}-avatar.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      setSuccess('Avatar updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setErrors({ avatar: 'Failed to update avatar' });
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-gray-800">Profile</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-red-500 transition duration-200"
        >
          <X size={24} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      ) : (
        <>
          {success && (
            <div className="mb-4 flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <Check className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}

            <div className="flex gap-10">
              <div className="flex-1 space-y-8">
                <div className="bg-gray-100 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-base font-medium text-gray-700">Username</label>
                    <button
                      onClick={() => setEditField('username')}
                      className="text-gray-500 hover:text-blue-500 transition duration-200"
                      disabled={updating}
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                  {editField === 'username' ? (
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={profile.username}
                          onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                          className={`flex-1 rounded-lg border ${errors.username ? 'border-red-300' : 'border-gray-300'} 
                            px-4 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-300`}
                          placeholder="Enter username"
                        />
                        <button
                          onClick={() => updateUsername(profile.username)}
                          disabled={updating}
                          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg 
                            hover:bg-blue-700 disabled:opacity-50 text-sm transition duration-200"
                        >
                          {updating ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save'}
                        </button>
                      </div>
                      {errors.username && (
                        <p className="text-sm text-red-500">{errors.username}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">{profile.username || 'No username set'}</p>
                  )}
                </div>

                <div className="bg-gray-100 rounded-lg p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-base font-medium text-gray-700">Bio</label>
                    <button
                      onClick={() => setEditField('bio')}
                      className="text-gray-500 hover:text-blue-500 transition duration-200"
                      disabled={updating}
                    >
                      <Pencil size={18} />
                    </button>
                  </div>
                  {editField === 'bio' ? (
                    <div className="space-y-2">
                      <div className="flex flex-col gap-3">
                        <textarea
                          value={profile.bio}
                          onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                          className={`w-full rounded-lg border ${errors.bio ? 'border-red-300' : 'border-gray-300'}
                            px-4 py-2 text-sm focus:border-blue-500 focus:ring focus:ring-blue-300`}
                          placeholder="Tell us about yourself"
                          rows={4}
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            {profile.bio.length}/500 characters
                          </span>
                          <button
                            onClick={() => updateBio(profile.bio)}
                            disabled={updating}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 
                              rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm transition duration-200"
                          >
                            {updating ? <Loader2 className="animate-spin h-4 w-4" /> : 'Save'}
                          </button>
                        </div>
                      </div>
                      {errors.bio && (
                        <p className="text-sm text-red-500">{errors.bio}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">{profile.bio || 'No bio yet'}</p>
                  )}
                </div>
              </div>

              <div className="w-72">
                <div className="bg-gray-100 rounded-lg p-5 shadow-sm text-center">
                  <div className="mb-5 relative">
                    {updating && (
                      <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
                        <Loader2 className="animate-spin h-8 w-8 text-white" />
                      </div>
                    )}
                    <img
                      src={profile.avatar_url || '/default-avatar.png'}
                      alt="Profile"
                      className="w-36 h-36 rounded-full mx-auto shadow-md border-4 border-gray-200 object-cover"
                    />
                  </div>
                  <div className="space-y-4">
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
                      className={`inline-flex items-center gap-3 ${updating ? 'bg-gray-100 cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-200 cursor-pointer'}
                        text-blue-600 px-5 py-2 rounded-lg border border-blue-300 transition duration-200`}
                    >
                      <Upload size={18} />
                      <span>Upload Avatar</span>
                    </label>
                    {errors.avatar && (
                      <p className="text-sm text-red-500">{errors.avatar}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileFormModal;