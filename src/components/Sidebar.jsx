import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import { Search, LogOut, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
import api from '../services/api';
import { format } from 'date-fns';

export default function Sidebar() {
    const { user, logout } = useAuthStore();
    const { conversations, activeConversation, setActiveConversation, fetchConversations, deleteConversation } = useChatStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const handleSearch = async (term) => {
        setSearchTerm(term);
        if (term.length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await api.get(`/users/search?q=${term}`);
            setSearchResults(response.data.users);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = (selectedUser) => {
        // Check if conversation exists, if not, create temp one or just set active
        setActiveConversation(selectedUser);
        setSearchTerm(''); // Clear search
        setSearchResults([]);
    };

    const displayList = searchTerm.length > 0 ? searchResults : conversations;

    return (
        <div className="w-full md:w-80 border-r border-gray-200 h-full bg-white flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{user?.username}</h3>
                        <div className="flex items-center text-xs text-green-500">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                            Online
                        </div>
                    </div>
                </div>
                <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                    <LogOut size={20} />
                </button>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {displayList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <MessageSquare size={40} className="mb-2 opacity-50" />
                        <p className="text-sm">No chats found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {displayList.map((item) => {
                            // Backend returns flat user/conversation objects
                            // item = { id, username, avatarUrl, ..., lastMessage }

                            // If we are showing the main list (not searching), these are all existing conversations
                            // If searching, 'item' is just a user result
                            const isConversationItem = searchTerm.length === 0;
                            const displayUser = item;
                            const lastMessage = item.lastMessage;

                            const isActive = activeConversation?.id === displayUser.id;

                            return (
                                <button
                                    key={displayUser.id}
                                    onClick={() => handleSelectUser(displayUser)}
                                    className={cn(
                                        "w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left group",
                                        isActive && "bg-primary-50 hover:bg-primary-50 border-l-4 border-primary-500"
                                    )}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                            {displayUser.username?.[0]?.toUpperCase()}
                                        </div>
                                        {displayUser.isOnline && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className={cn("font-medium truncate", isActive ? "text-primary-900" : "text-gray-900")}>
                                                {displayUser.username}
                                            </h4>
                                            {lastMessage && (
                                                <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                                                    {format(new Date(lastMessage.createdAt), 'HH:mm')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={cn("text-sm truncate max-w-[170px]", isActive ? "text-primary-700" : "text-gray-500")}>
                                                {lastMessage ? lastMessage.content : 'Start chatting'}
                                            </p>
                                            {isConversationItem && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Delete conversation with ${displayUser.username}?`)) {
                                                            deleteConversation(displayUser.id);
                                                        }
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Delete conversation"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
