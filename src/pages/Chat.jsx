import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import ChatWindow from '../components/ChatWindow';
import UserProfilesBar from '../components/UserProfilesBar';
import ConversationList from '../components/ConversationList';

function Chat() {
  const { user, signOut } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  useEffect(() => {
    fetchConversations();
    fetchUsers();
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
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <p>Loading...</p>
    </div>;
  }

  

  return (
    <div className="min-h-screen bg-gray-100"> 
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4">
          {/* Profile Bar */}
          <div className="w-30 bg-white rounded-lg shadow-sm">
            <UserProfilesBar />
          </div>

          {/* Conversations List */}
          <div className="w-1/3">
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
            />
          </div>

          {/* Chat Window */}
          <div className="w-2/3">
            {activeConversation ? (
              <ChatWindow conversation={activeConversation} />
            ) : (
              <div className="h-[850px] bg-white rounded-lg shadow flex items-center justify-center">
                <p className="text-gray-500">
                  Select a conversation or start a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;