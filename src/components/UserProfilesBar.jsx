// UserProfilesBar.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import ProfileFormModal from '../pages/ProfileFormModel';

const UserProfilesBar = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const getAvatarUrl = (profile) => {
    return profile?.avatar_url || "./public/cat.png";
  };

  return (
    <>
    <div className="h-full flex lg:flex-col justify-end">
      <div className="p-4 flex lg:flex-col items-center">
        <button
          onClick={() => setIsProfileFormOpen(true)}
          className="relative group"
        >
          <img
            src={getAvatarUrl(profile)}
            alt={profile?.username || 'Profile'}
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full hover:ring-2 hover:ring-blue-500"
          />
          <div className="invisible group-hover:visible absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap">
            Profile
          </div>
        </button>
      </div>
    </div>
      
      <ProfileFormModal 
        isOpen={isProfileFormOpen}
        onClose={() => {
          setIsProfileFormOpen(false);
          fetchProfile();
        }}
      />
    </>
  );
};

export default UserProfilesBar;
