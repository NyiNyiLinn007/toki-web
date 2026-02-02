import { useState, useRef, useEffect } from 'react';
import { Send, Image, Smile, MoreVertical, ArrowLeft, Eye, Pencil, X } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import socketService from '../services/socket';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '../utils/cn';

export default function ChatArea() {
    const { user } = useAuthStore();
    const { activeConversation, messages, sendOptimisticMessage, setActiveConversation } = useChatStore();
    const [inputText, setInputText] = useState('');
    const [editingMessage, setEditingMessage] = useState(null);
    const messagesEndRef = useRef(null);

    const currentMessages = activeConversation ? (messages[activeConversation.id] || []) : [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const startEditing = (msg) => {
        setEditingMessage(msg);
        setInputText(msg.content);
    };

    const cancelEditing = () => {
        setEditingMessage(null);
        setInputText('');
    };

    useEffect(() => {
        scrollToBottom();

        // Mark messages as read if they are from the other user and unread
        if (activeConversation && currentMessages.length > 0) {
            const unreadMessages = currentMessages.filter(
                m => m.senderId === activeConversation.id && !m.isRead
            );

            if (unreadMessages.length > 0) {
                const messageIds = unreadMessages.map(m => m.id);
                socketService.emit('mark_read', {
                    messageIds,
                    senderId: activeConversation.id
                });
            }
        }
    }, [currentMessages, activeConversation]);

    const handleBack = () => {
        setActiveConversation(null);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim() || !activeConversation) return;

        // If we are editing a message
        if (editingMessage) {
            socketService.emit('edit_message', {
                messageId: editingMessage.id,
                content: inputText.trim(),
                receiverId: activeConversation.id
            });

            // Clear editing state
            setEditingMessage(null);
            setInputText('');
            return;
        }

        const tempId = uuidv4();
        const content = inputText.trim();

        // Create optimistic message
        const optimisticMessage = {
            id: tempId,
            senderId: user.id,
            receiverId: activeConversation.id,
            content: content,
            createdAt: new Date().toISOString(),
            isOptimistic: true
        };

        // Update UI immediately
        sendOptimisticMessage(optimisticMessage);
        setInputText('');

        // Emit via Socket
        socketService.emit('send_message', {
            receiverId: activeConversation.id,
            content: content,
            tempId: tempId
        });
    };

    if (!activeConversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">👋</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Toki</h2>
                <p className="text-gray-500 max-w-sm text-center">
                    Select a conversation from the sidebar or search for a user to start chatting.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 bg-white z-10">
                <div className="flex items-center space-x-3">
                    {/* Back Button for Mobile */}
                    <button onClick={handleBack} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>

                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                        {activeConversation.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">{activeConversation.username}</h3>
                        <div className="flex items-center text-xs text-green-500">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Online
                        </div>
                    </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 custom-scrollbar">
                {currentMessages.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">
                        <p>No messages yet. Say hello! 👋</p>
                    </div>
                )}

                {currentMessages.map((msg) => {
                    const isMe = msg.senderId === user.id;
                    return (
                        <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div
                                className={cn(
                                    "max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-sm break-words relative group",
                                    isMe
                                        ? "bg-primary-600 text-white rounded-br-none"
                                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                                )}
                            >
                                {isMe && (
                                    <button
                                        onClick={() => startEditing(msg)}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-black/10 rounded hover:bg-black/20 text-white transition-all"
                                        title="Edit"
                                    >
                                        <Pencil size={10} />
                                    </button>
                                )}
                                <p>
                                    {msg.content}
                                    {msg.isEdited && <span className="text-[10px] italic ml-1 opacity-60">(edited)</span>}
                                </p>
                                <div className="flex items-center justify-end space-x-1 mt-1">
                                    <span className={cn(
                                        "text-[10px] opacity-70",
                                        isMe ? "text-indigo-100" : "text-gray-400"
                                    )}>
                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                    </span>
                                    {isMe && msg.isRead && (
                                        <Eye size={12} className="text-indigo-200" />
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                {editingMessage && (
                    <div className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-t-lg text-sm text-gray-600">
                        <span>Editing message...</span>
                        <button onClick={cancelEditing}><X size={14} /></button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className={cn("flex items-center space-x-2", editingMessage && "bg-gray-50 rounded-b-lg p-2")}>
                    <button type="button" className="p-2 text-gray-400 hover:text-primary-600 transition-colors bg-gray-50 hover:bg-primary-50 rounded-full">
                        <Image size={20} />
                    </button>
                    <button type="button" className="p-2 text-gray-400 hover:text-primary-600 transition-colors bg-gray-50 hover:bg-primary-50 rounded-full mr-2">
                        <Smile size={20} />
                    </button>

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full pl-5 pr-12 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-primary-100 rounded-full focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className="absolute right-1 top-1 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary-600/20"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
