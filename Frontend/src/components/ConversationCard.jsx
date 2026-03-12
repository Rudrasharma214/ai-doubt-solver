import { MessageSquare, FileText, Clock, Trash2, User, Edit3, Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom';
import { useDeleteConversation, useUpdateConversationTitle } from '../hooks/Conversation/useMutation.js';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const ConversationCard = ({ conversation }) => {
  const navigate = useNavigate();
  const { mutate: deleteConversation } = useDeleteConversation();
  const { mutateAsync: updateTitle, isLoading: updatingTitle } = useUpdateConversationTitle();

  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(conversation.title || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalTitle(conversation.title || '');
  }, [conversation.title]);


  const formatDate = (date) => {
    const now = new Date();
    const conversationDate = new Date(date);
    const diffInMs = now - conversationDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return conversationDate.toLocaleDateString();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(conversation._id, {
        onSuccess: () => {
          toast.success('Conversation deleted successfully');
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message || 'Failed to delete conversation');
        },
      });
    }
  };

  const startEditing = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEditing = (e) => {
    e?.stopPropagation();
    setLocalTitle(conversation.title || '');
    setIsEditing(false);
  };

  const saveTitle = async (e) => {
    e?.stopPropagation();
    const trimmed = (localTitle || '').trim();
    if (!trimmed) {
      toast.error('Title cannot be empty');
      return;
    }
    if (trimmed === (conversation.title || '')) {
      setIsEditing(false);
      return;
    }

    try {
      await updateTitle({ conversationId: conversation._id, title: trimmed });
      toast.success('Title updated');
      setIsEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update title');
    }
  };


  const handleCardClick = () => {
    navigate(`/document/${conversation.documentId._id}`);
  };

  const messageCount = conversation.messages?.length || 0;
  const lastMessage = conversation.messages?.[conversation.messages.length - 1]?.content || 'No messages yet';
  const documentName = conversation.documentId?.filename || 'Unknown Document';

  return (
    <div
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 flex justify-between items-start cursor-pointer"
    >
      <div className="block group flex-1 min-w-0 pr-4">
        {!isEditing ? (
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
              {conversation.title || 'Untitled Conversation'}
            </h3>
            <button onClick={startEditing} onMouseDown={(e) => e.stopPropagation()} title="Edit title" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              <Edit3 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle(e);
                if (e.key === 'Escape') cancelEditing(e);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button onClick={saveTitle} disabled={updatingTitle} className="text-green-600 hover:text-green-800" title="Save">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600" title="Cancel">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
          <div className="flex items-center space-x-1">
            <FileText className="h-4 w-4" />
            <span>{documentName}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatDate(conversation.createdAt)}</span>
          </div>
        </div>

        {/* Last Message Preview */}
        {lastMessage && lastMessage !== 'No messages yet' && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-start space-x-2">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {lastMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="text-gray-400 hover:text-red-600 transition-colors p-2 -mt-1 -mr-1"
        title="Delete conversation"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ConversationCard;