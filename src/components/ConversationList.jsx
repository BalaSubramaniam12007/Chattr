import { useAuth } from '../contexts/AuthContext';

function ConversationList({
  conversations,
  activeConversation,
  onSelect,
  onNewChat,
  onSearch,
  showNewChat,
  users,
  onStartNewConversation,
  currentUserId,
  onlineUsers
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <button
          onClick={onNewChat}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          New Chat
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search conversations..."
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {showNewChat && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Start new chat with:</h3>
          <div className="space-y-2">
            {users.map((otherUser) => (
              <button
                key={otherUser.id}
                onClick={() => onStartNewConversation(otherUser.id)}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg"
              >
                <div className="relative">
                  <img
                    src={otherUser.avatar_url || 'Chattr/bg.jpeg'}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border border-gray-300"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      onlineUsers?.has(otherUser.id) ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{otherUser.username}</p>
                  <p className="text-sm text-gray-500">
                    {onlineUsers?.has(otherUser.id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {conversations.length > 0 ? (
          conversations.map((conversation) => {
            const otherUser =
              conversation.user1.id === currentUserId
                ? conversation.user2
                : conversation.user1;

            const isUserOnline = onlineUsers?.has(otherUser.id);

            return (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  activeConversation?.id === conversation.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative">
                  <img
                    src={otherUser.avatar_url || 'Chattr/bg.jpeg'}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border border-gray-300"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      isUserOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium truncate">{otherUser.username}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {isUserOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <p className="text-center text-gray-500">No conversations found.</p>
        )}
      </div>
    </div>
  );
}

export default ConversationList;