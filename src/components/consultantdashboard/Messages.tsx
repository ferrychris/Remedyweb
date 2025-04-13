import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  MessageSquare, 
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Send,
  CheckCircle2
} from 'lucide-react';

interface Message {
  id: string;
  patient_id: string;
  patient_name: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  patient_id: string;
  patient_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Conversation>('last_message_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch unique patients with messages
      const { data: conversationsData, error } = await supabase
        .from('messages')
        .select(`
          patient_id,
          user_profiles:patient_id (name),
          created_at,
          content,
          is_read
        `)
        .eq('consultant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by patient
      const groupedConversations = conversationsData?.reduce((acc: { [key: string]: Conversation }, msg) => {
        if (!acc[msg.patient_id]) {
          acc[msg.patient_id] = {
            patient_id: msg.patient_id,
            patient_name: msg.user_profiles?.[0]?.name || 'Unknown',
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0
          };
        }
        if (!msg.is_read) {
          acc[msg.patient_id].unread_count++;
        }
        return acc;
      }, {});

      setConversations(Object.values(groupedConversations || {}));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (patientId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          is_read,
          user_profiles:patient_id (name)
        `)
        .eq('consultant_id', user.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = messagesData?.map(msg => ({
        id: msg.id,
        patient_id: patientId,
        patient_name: msg.user_profiles?.[0]?.name || 'Unknown',
        content: msg.content,
        created_at: msg.created_at,
        is_read: msg.is_read
      })) || [];

      setMessages(formattedMessages);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('consultant_id', user.id)
        .eq('patient_id', patientId)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          consultant_id: user.id,
          patient_id: selectedConversation,
          content: newMessage,
          is_read: true
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedConversation);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc'
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-t-2 border-emerald-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
          </div>
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sortedConversations.map((conversation) => (
            <div
              key={conversation.patient_id}
              className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                selectedConversation === conversation.patient_id ? 'bg-gray-50' : ''
              }`}
              onClick={() => setSelectedConversation(conversation.patient_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{conversation.patient_name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{conversation.last_message}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-500">
                    {new Date(conversation.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {conversation.unread_count > 0 && (
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500 text-white text-xs">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 flex ${message.is_read ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs rounded-lg p-3 ${
                    message.is_read ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    <div className="text-sm text-gray-900">{message.content}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="flex-1 block w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  onClick={handleSendMessage}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No conversation selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 