// src/pages/Chat.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabase';
import ChatWindow from '../components/ChatWindow';

function Chat() {
  const { user, signOut } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);

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
      // Check if conversation already exists
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

      // Create new conversation
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

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Chattr</h1>
          <button
            onClick={signOut}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4">
          {/* Sidebar */}
          <div className="w-1/3 bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Conversations</h2>
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                New Chat
              </button>
            </div>

            {showNewChat && (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Start new chat with:</h3>
                <div className="space-y-2">
                  {users.map((otherUser) => (
                    <button
                      key={otherUser.id}
                      onClick={() => startNewConversation(otherUser.id)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                    >
                      {otherUser.username}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`w-full text-left px-3 py-2 rounded ${
                    activeConversation?.id === conversation.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Chat with{' '}
                  {conversation.user1.id === user.id
                    ? conversation.user2.username
                    : conversation.user1.username}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="w-2/3">
            {activeConversation ? (
              <ChatWindow conversation={activeConversation} />
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