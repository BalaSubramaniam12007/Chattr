// Chat.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import ChatWindow from '../components/ChatWindow';
import UserProfilesBar from '../components/UserProfilesBar';
import ConversationList from '../components/ConversationList';
import { ArrowLeft } from 'lucide-react';

function Chat() {
  const { user, signOut } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchUsers();
    const cleanupPresence = setupPresenceChannel();
  
    return () => {
      if (cleanupPresence) {
        cleanupPresence();
      }
    };
  }, [user]);

  const setupPresenceChannel = () => {
    const channel = supabase.channel('online_users');
  
    // First, define the cleanup function
    const cleanup = async () => {
      try {
        await channel.untrack();
        await channel.unsubscribe();
      } catch (error) {
        console.error('Error cleaning up presence channel:', error);
      }
    };
  
    // Then your existing channel setup code
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineUserIds = new Set(
          Object.values(state)
            .flat()
            .map(presence => presence.user_id)
        );
        setOnlineUsers(onlineUserIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prevUsers => {
          const newSet = new Set(prevUsers);
          newPresences.forEach(presence => newSet.add(presence.user_id));
          return newSet;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prevUsers => {
          const newSet = new Set(prevUsers);
          leftPresences.forEach(presence => newSet.delete(presence.user_id));
          return newSet;
        });
      });
  
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    });
  
    // Add these lines at the end of setupPresenceChannel
    window.addEventListener('beforeunload', cleanup);
  
    return () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };
  };
  
  // Then in your useEffect, make sure to use the cleanup function:
  useEffect(() => {
    fetchConversations();
    fetchUsers();
    const cleanupPresence = setupPresenceChannel();
  
    return () => {
      if (cleanupPresence) {
        cleanupPresence();
      }
    };
  }, [user]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!user1_id(*),
          user2:profiles!user2_id(*)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;
      setConversations(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const startNewConversation = async (otherUserId) => {
    try {
      const existingConversation = conversations.find(
        (conv) =>
          (conv.user1_id === user.id && conv.user2_id === otherUserId) ||
          (conv.user1_id === otherUserId && conv.user2_id === user.id)
      );

      if (existingConversation) {
        setActiveConversation(existingConversation);
        setShowNewChat(false);
        return;
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: user.id,
          user2_id: otherUserId,
        })
        .select(`
          *,
          user1:profiles!user1_id(*),
          user2:profiles!user2_id(*)
        `)
        .single();

      if (error) throw error;

      setConversations([...conversations, data]);
      setActiveConversation(data);
      setShowNewChat(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredConversations = conversations?.filter((conversation) => {
    if (!conversation.user1 || !conversation.user2) return false;
    const otherUser = conversation.user1.id === user.id ? conversation.user2 : conversation.user1;
    return otherUser.username?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-100"> 
    {/*Desktop header*/}
      <nav className="bg-white shadow-sm hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Chattr</h1>
          <button
            onClick={signOut}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </nav>
      {/* Mobile Header */}
      <nav className="bg-white shadow-sm lg:hidden">
        <div className="px-4 py-4 flex justify-between items-center">
          {activeConversation && isMobileView ? (
            <>
              <button
                onClick={() => setActiveConversation(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={24} />
              </button>
              <span className="font-semibold">{
                activeConversation.user1.id === user.id 
                  ? activeConversation.user2.username 
                  : activeConversation.user1.username
              }</span>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">Chattr</h1>
              <UserProfilesBar />
            </>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4">
          {/* UserProfilesBar - Only visible on desktop */}
          <div className="hidden lg:block w-30 bg-white rounded-lg shadow-sm">
            <UserProfilesBar />
          </div>

          {/* ConversationList - Full width on mobile when no active chat */}
          <div className={`
            ${isMobileView ? 'w-full' : 'w-1/3'} 
            ${activeConversation && isMobileView ? 'hidden' : 'block'}
          `}>
            <div className="bg-white rounded-lg shadow-sm h-[850px]">
              <ConversationList
                conversations={filteredConversations}
                activeConversation={activeConversation}
                onSelect={setActiveConversation}
                onNewChat={() => setShowNewChat(!showNewChat)}
                onSearch={handleSearch}
                showNewChat={showNewChat}
                users={users}
                onStartNewConversation={startNewConversation}
                currentUserId={user.id}
                onlineUsers={onlineUsers}
              />
            </div>
          </div>

          {/* ChatWindow - Full width on mobile when active */}
          <div className={`
            ${isMobileView ? 'w-full' : 'w-2/3'}
            ${!activeConversation && isMobileView ? 'hidden' : 'block'}
          `}>
            {activeConversation ? (
              <ChatWindow 
                conversation={activeConversation} 
                isOnline={onlineUsers.has(
                  activeConversation.user1_id === user.id 
                    ? activeConversation.user2_id 
                    : activeConversation.user1_id
                )} 
              />
            ) : (
              <div className="h-[850px] bg-white rounded-lg shadow flex items-center justify-center">
                <p className="text-gray-500">
                  Select a conversation or start a new one
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;