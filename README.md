# Chattr - Real-time Chat Application

A modern, responsive real-time chat application built with React and Supabase. Chattr offers seamless messaging with user presence tracking, profile management, and an intuitive interface that functions flawlessly on both desktop and mobile devices.

## ✨ Features

### Core Functionality
- **Real-time Messaging**: Instant message delivery using Supabase real-time subscriptions
- **User Authentication**: Secure email/password authentication with Supabase Auth
- **Conversation Management**: Create new conversations and manage existing ones
- **Message Status**: Read receipts with visual indicators (single/double check marks)
- **User Presence**: See who's online/offline in real-time
- **Responsive Design**: Fully responsive interface optimized for mobile and desktop

### User Experience
- **Profile Management**: Customizable profiles with avatar upload, username, and bio
- **Search Functionality**: Search through conversations and users
- **Mobile-First Design**: Optimized mobile experience with proper navigation
- **Auto-scroll**: Automatic scrolling to the latest messages
- **Typing Indicators**: Visual feedback for message delivery status

### Technical Features
- **Real-time Updates**: Live message updates without page refresh
- **Presence System**: Track user online/offline status
- **File Upload**: Avatar image upload with Supabase Storage
- **Protected Routes**: Secure route protection for authenticated users
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠️ Tech Stack

- **Frontend**: React 18 with Hooks
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time + Auth + Storage)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Build Tool**: Vite

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account and project

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chattr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase Database**
   
   Run the following SQL commands in your Supabase SQL editor:

   ```sql
   -- Create profiles table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users ON DELETE CASCADE,
     username TEXT UNIQUE,
     avatar_url TEXT,
     bio TEXT,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     PRIMARY KEY (id)
   );

   -- Create conversations table
   CREATE TABLE conversations (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create messages table
   CREATE TABLE messages (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
     sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     content TEXT NOT NULL,
     read BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable RLS (Row Level Security)
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
   CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
   CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

   CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
   CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user1_id);

   CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
     EXISTS (
       SELECT 1 FROM conversations 
       WHERE conversations.id = messages.conversation_id 
       AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
     )
   );
   CREATE POLICY "Users can insert messages in their conversations" ON messages FOR INSERT WITH CHECK (
     EXISTS (
       SELECT 1 FROM conversations 
       WHERE conversations.id = messages.conversation_id 
       AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
     )
   );
   CREATE POLICY "Users can update messages in their conversations" ON messages FOR UPDATE USING (
     EXISTS (
       SELECT 1 FROM conversations 
       WHERE conversations.id = messages.conversation_id 
       AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
     )
   );
   ```

5. **Set up Supabase Storage**
   
   Create a storage bucket named `avatars` in your Supabase dashboard and set it to public.

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 📱 Usage

### Getting Started
1. **Sign Up/Sign In**: Create an account or sign in with existing credentials
2. **Set Up Profile**: Click on your profile avatar to set username, bio, and profile picture
3. **Start Chatting**: Use the "+" button to search for users and start new conversations
4. **Real-time Messaging**: Send and receive messages instantly

### Key Features
- **Creating Conversations**: Click the "+" icon and search for users by username
- **Managing Profile**: Click your avatar to edit profile information
- **Message Status**: See delivery and read status with check marks
- **Online Status**: Green dot indicates online users
- **Search**: Use search to find specific conversations

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ChatMessage.jsx          # Individual message component
│   ├── ChatWindow.jsx           # Main chat interface
│   ├── ConversationList.jsx     # Sidebar with conversations
│   ├── ProtectedRoute.jsx       # Route protection component
│   └── UserProfilesBar.jsx      # Profile sidebar component
├── contexts/
│   └── AuthContext.jsx          # Authentication context
├── pages/
│   ├── Auth.jsx                 # Login/Register page
│   ├── Chat.jsx                 # Main chat page
│   ├── NotFound.jsx            # 404 page
│   └── ProfileFormModal.jsx    # Profile editing modal
└── utils/
    └── supabase.js             # Supabase client configuration
```

## 🔧 Configuration

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Supabase Configuration
The app requires proper setup of:
- Authentication (Email/Password)
- Database tables with RLS policies
- Storage bucket for avatars
- Real-time subscriptions enabled

## 📱 Mobile Responsiveness

Chattr is designed with a mobile-first approach:
- **Responsive Layout**: Adapts to different screen sizes
- **Touch-Friendly**: Optimized for touch interactions
- **Mobile Navigation**: Proper mobile navigation patterns
- **Swipe Gestures**: Intuitive mobile user experience

## 🔐 Security Features

- **Row Level Security**: Database-level security with Supabase RLS
- **Protected Routes**: Client-side route protection
- **Authentication**: Secure user authentication
- **Data Validation**: Input validation and sanitization

## 🚀 Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred platform**
   - Vercel, Netlify, or any static hosting service
   - Make sure to set environment variables in your deployment platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues

- Profile images require manual refresh after upload in some cases
- Message ordering might need adjustment during high-traffic periods

## 🔮 Future Enhancements (Chattr2.0)

- **Group Chats**: Support for multiple users in conversations
- **File Sharing**: Support for image and file attachments
- **Push Notifications**: Browser notifications for new messages
- **Emoji Reactions**: React to messages with emojis
- **Message Search**: Search within conversation history
- **Dark Mode**: Toggle between light and dark themes
- **Voice Messages**: Record and send voice messages


## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons
- [React](https://reactjs.org/) for the frontend framework

## Contributors  

<a href="https://github.com/BalaSubramaniam12007">
    <img src="https://github.com/BalaSubramaniam12007.png" width="50" height="50" class="circular">
</a>

<a href="https://github.com/shivas1516">
    <img src="https://github.com/shivas1516.png" width="50" height="50" class="circular">
</a>
