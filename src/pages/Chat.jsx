// Chat.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabase";
import ChatWindow from "../components/ChatWindow";
import UserProfilesBar from "../components/UserProfilesBar";
import ConversationList from "../components/ConversationList";
import { ArrowLeft } from "lucide-react";

function Chat() {
  const { user, signOut } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    const channel = supabase.channel("online_users");
    const cleanup = async () => {
      try {
        await channel.untrack();
        await channel.unsubscribe();
      } catch (error) {
        console.error("Error cleaning up presence channel:", error);
      }
    };

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const onlineUserIds = new Set(
          Object.values(state)
            .flat()
            .map((presence) => presence.user_id)
        );
        setOnlineUsers(onlineUserIds);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        setOnlineUsers((prevUsers) => {
          const newSet = new Set(prevUsers);
          newPresences.forEach((presence) => newSet.add(presence.user_id));
          return newSet;
        });
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        setOnlineUsers((prevUsers) => {
          const newSet = new Set(prevUsers);
          leftPresences.forEach((presence) => newSet.delete(presence.user_id));
          return newSet;
        });
      });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    });

    window.addEventListener("beforeunload", cleanup);

    return () => {
      cleanup();
      window.removeEventListener("beforeunload", cleanup);
    };
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          *,
          user1:profiles!user1_id(*),
          user2:profiles!user2_id(*)
        `
        )
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;
      setConversations(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
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
        .from("conversations")
        .insert({
          user1_id: user.id,
          user2_id: otherUserId,
        })
        .select(
          `
          *,
          user1:profiles!user1_id(*),
          user2:profiles!user2_id(*)
        `
        )
        .single();

      if (error) throw error;

      setConversations([...conversations, data]);
      setActiveConversation(data);
      setShowNewChat(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const filteredConversations =
    conversations?.filter((conversation) => {
      if (!conversation.user1 || !conversation.user2) return false;
      const otherUser =
        conversation.user1.id === user.id
          ? conversation.user2
          : conversation.user1;
      return otherUser.username
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
    }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const handleBackToList = () => {
    setActiveConversation(null);
  };

   return (
    <div className="h-screen flex flex-col bg-white sm:bg-gray-100">
     {/* Mobile Header - Only show when no active conversation */}
      {isMobileView && !activeConversation && (
        <div className="bg-white relative z-10">
          <div className="flex justify-between items-center h-14 px-4">
            <h1 className="text-xl font-bold">Chattr</h1>
            <div className="flex items-center gap-4">
              <div className="lg:block w-15 bg-white rounded-lg shadow-sm">
                <UserProfilesBar />
              </div>
              <button
                onClick={signOut}
                className="bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition"
              >
                SignOut
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Desktop Header */}
      <nav className="bg-white shadow-sm hidden lg:block flex-shrink-0">
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

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 py-4 lg:py-8">
          <div className={`flex h-full ${isMobileView ? "" : "gap-4"}`}>
            {/* UserProfilesBar - Only visible on desktop */}
            <div className="hidden lg:block w-20 bg-white rounded-lg shadow-sm">
              <UserProfilesBar />
            </div>

            {/* ConversationList */}
            <div
              className={`
                ${isMobileView ? "w-full h-screen fixed inset-0 pt-14" : "w-1/3"} 
                ${activeConversation && isMobileView ? "hidden" : "block"}
              `}
            >
              <div
                className={`
                  ${isMobileView ? "h-full pt-14" : "bg-white rounded-lg shadow-sm h-full"}
                  ${!activeConversation && isMobileView ? "-mt-14" : ""}
                `}
              >
                <ConversationList
                  conversations={filteredConversations}
                  activeConversation={activeConversation}
                  onSelect={setActiveConversation}
                  onSearch={handleSearch}
                  users={users}
                  onStartNewConversation={startNewConversation}
                  currentUserId={user.id}
                  onlineUsers={onlineUsers}
                />
              </div>
            </div>

            {/* ChatWindow */}
            <div
              className={`
                ${isMobileView ? "w-full h-screen fixed inset-0" : "w-2/3"}
                ${!activeConversation && isMobileView ? "hidden" : "block"}
              `}
            >
              {activeConversation ? (
                <div
                  className={`h-full ${
                    isMobileView ? "bg-white" : "bg-white rounded-lg shadow-sm"
                  }`}
                >
                  <ChatWindow
                    conversation={activeConversation}
                    isOnline={onlineUsers.has(
                      activeConversation.user1_id === user.id
                        ? activeConversation.user2_id
                        : activeConversation.user1_id
                    )}
                    onBackToList={handleBackToList}
                  />
                </div>
              ) : (
                <div
                  className={`
                    h-full
                    bg-white 
                    ${isMobileView ? "" : "rounded-lg shadow"} 
                    flex items-center justify-center
                  `}
                >
                  <p className="text-gray-500">
                    Select a conversation or start a new one
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
