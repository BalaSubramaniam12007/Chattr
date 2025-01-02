// src/components/ChatWindow.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import ChatMessage from './ChatMessage';

function ChatWindow({ conversation }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    const messagesSubscription = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          // Only add the message if it's not from the current user
          if (payload.new.sender_id !== user.id) {
            setMessages((current) => [...current, payload.new]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [conversation.id]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const newMsg = {
        conversation_id: conversation.id,
        sender_id: user.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
      };

      // Optimistically add the message to the UI
      setMessages((current) => [...current, newMsg]);
      setNewMessage('');
      scrollToBottom();

      // Send to Supabase
      const { error, data } = await supabase
        .from('messages')
        .insert(newMsg)
        .select()
        .single();

      if (error) throw error;

      // Update the temporary message with the real one from the database
      setMessages((current) =>
        current.map((msg) =>
          msg === newMsg ? data : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the temporary message if there was an error
      setMessages((current) =>
        current.filter((msg) => msg !== newMsg)
      );
      alert('Failed to send message');
    }
  };

  const getAvatarUrl = (profile) => {
    return profile?.avatar_url || "./public/cat.png";
  };

  return (
    <div className="flex flex-col h-[850px] bg-white rounded-lg shadow">
      <div className="p-4 flex items-center">
  {/* Profile Image */}
  <img
    src={getAvatarUrl(profile)}
    alt={profile?.username || 'Profile'}
    className="w-12 h-12 rounded-full hover:ring-2 hover:ring-blue-500"
  />
  
  {/* Chat Header */}
  <div className="ml-4">
    <h3 className="text-lg font-bold text-gray-800">
      {conversation.user1.id === user.id
        ? conversation.user2.username
        : conversation.user1.username}
    </h3>
  </div>
</div>


      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet</div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage 
              key={message.id || index} 
              message={message} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatWindow;