import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ChatMessage = ({ message }) => {
  const { user } = useAuth();
  const isOwner = message.sender_id === user.id;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };


  return (
    <div className={`flex ${isOwner ? 'justify-end' : 'justify-start'} mb-3 px-2 sm:px-4`}>
      <div className="flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[65%]">
        <div
          className={`rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 ${
            isOwner
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
            {message.content}
          </p>
        
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;