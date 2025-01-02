// src/components/ChatMessage.jsx
import { useAuth } from '../contexts/AuthContext';

function ChatMessage({ message }) {
  const { user } = useAuth();
  const isOwner = message.sender_id === user.id;

  return (
    <div className={`flex ${isOwner ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isOwner
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <span className="text-xs opacity-60">
          {new Date(message.created_at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

export default ChatMessage;