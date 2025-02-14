import React, { useState } from "react";
import { Plus, Search, ArrowLeft } from "lucide-react";

function ConversationList({
  conversations,
  activeConversation,
  onSelect,
  onSearch,
  users,
  onStartNewConversation,
  currentUserId,
  onlineUsers,
}) {
  const [showNewUserSearch, setShowNewUserSearch] = useState(false);
  const [newUserSearchQuery, setNewUserSearchQuery] = useState("");
  const [conversationSearchQuery, setConversationSearchQuery] = useState("");
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Modified filter to only match from start of username
  const filteredUsers = users.filter(
    (user) =>
      user.id !== currentUserId &&
      user.username.toLowerCase().startsWith(newUserSearchQuery.toLowerCase())
  );

  // Filter conversations based on the other user's username starting with search query
  const filteredConversations = conversations.filter((conversation) => {
    const otherUser =
      conversation.user1.id === currentUserId
        ? conversation.user2
        : conversation.user1;
    return otherUser.username
      .toLowerCase()
      .startsWith(conversationSearchQuery.toLowerCase());
  });

  return (
    <div className="relative h-full flex flex-col bg-white overflow-hidden">
      {/* Main conversations view */}
      <div
        className={`absolute inset-0 flex flex-col transition-transform duration-300 ${
          showNewUserSearch ? "translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <div className="flex items-center space-x-2">
            {/* Search icon for mobile */}
            <button
              onClick={() => setShowMobileSearch(true)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
            >
              <Search size={24} />
            </button>
            <button
              onClick={() => setShowNewUserSearch(true)}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Search - hidden on mobile unless activated */}
        <div className={`flex-shrink-0 p-4 pb-2 ${showMobileSearch ? 'block' : 'hidden md:block'}`}>
          <div className="relative">
            {showMobileSearch && (
              <button
                onClick={() => setShowMobileSearch(false)}
                className="md:hidden absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <Search
              className={`absolute ${showMobileSearch ? 'left-10 md:left-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400`}
              size={20}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              className={`w-full ${showMobileSearch ? 'pl-16 md:pl-10' : 'pl-10'} pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              onChange={(e) => {
                setConversationSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
              autoFocus={showMobileSearch}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          <div className="space-y-2">
            {conversationSearchQuery ? (
              filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => {
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
                          ? "bg-blue-50 text-blue-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={otherUser.avatar_url || "Chattr/bg.jpeg"}
                          alt="Profile"
                          className="w-12 h-12 rounded-full border border-gray-300"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            isUserOnline ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium truncate">{otherUser.username}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {isUserOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No conversations found
                </p>
              )
            ) : conversations.length > 0 ? (
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
                        ? "bg-blue-50 text-blue-600"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={otherUser.avatar_url || "Chattr/bg.jpeg"}
                        alt="Profile"
                        className="w-12 h-12 rounded-full border border-gray-300"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          isUserOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium truncate">{otherUser.username}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {isUserOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-center text-gray-500 py-4">
                No conversations found
              </p>
            )}
          </div>
        </div>
      </div>

      {/* User search view - rest of the code remains the same */}
      <div
        className={`absolute inset-0 flex flex-col bg-white transition-transform duration-300 transform ${
          showNewUserSearch ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setShowNewUserSearch(false);
                setNewUserSearchQuery("");
              }}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-semibold">New Chat</h2>
          </div>
        </div>

        {/* Search */}
        <div className="flex-shrink-0 p-4 pb-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newUserSearchQuery}
              onChange={(e) => setNewUserSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          <div className="space-y-2">
            {newUserSearchQuery && filteredUsers.length > 0
              ? filteredUsers.map((otherUser) => (
                  <button
                    key={otherUser.id}
                    onClick={() => {
                      onStartNewConversation(otherUser.id);
                      setShowNewUserSearch(false);
                      setNewUserSearchQuery("");
                    }}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="relative">
                      <img
                        src={otherUser.avatar_url || "Chattr/bg.jpeg"}
                        alt="Profile"
                        className="w-12 h-12 rounded-full border border-gray-300"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          onlineUsers?.has(otherUser.id)
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{otherUser.username}</p>
                      <p className="text-sm text-gray-500">
                        {onlineUsers?.has(otherUser.id) ? "Online" : "Offline"}
                      </p>
                    </div>
                  </button>
                ))
              : newUserSearchQuery && (
                  <p className="text-center text-gray-500 py-4">
                    No users found
                  </p>
                )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConversationList;
