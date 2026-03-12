import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import ConversationCard from '../components/ConversationCard';
import {
  useGetConversations,
  useGetConversationsStats,
} from '../hooks/Conversation/useQueries.js';

const Conversation = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  // Search (debounced)
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1); // reset to first page on new search
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  /* Queries */
  const {
    data: conversationsRes,
    isLoading: conversationsLoading,
    isError: conversationsError,
    error: conversationsErr,
  } = useGetConversations(page, limit, debouncedSearch);

  const {
    data: statsRes,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErr,
  } = useGetConversationsStats();

  useEffect(() => {
    if (conversationsError) {
      toast.error(conversationsErr?.response?.data?.message || 'Failed to load conversations');
    }
  }, [conversationsError]);

  useEffect(() => {
    if (statsError) {
      toast.error(statsErr?.response?.data?.message || 'Failed to load conversation stats');
    }
  }, [statsError]);

  /* Safe data extraction */
  const conversations = conversationsRes?.data?.conversations ?? [];
  const totalPages = conversationsRes?.pagination?.totalPages ?? 1;

  const stats = statsRes?.data ?? {
    totalConversations: 0,
    totalDocuments: 0,
    recentConversations: 0,
    activeDocumentsCount: 0,
  };

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-8 py-10 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2 drop-shadow">
          Your Conversations
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
          Browse and search through your AI-powered document conversations.
        </p>
      </div>

      {/* Stats Section */}
      {statsLoading ? (
        <div className="text-center text-gray-500">Loading statistics...</div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            value={stats.totalConversations}
            label="Total Conversations"
            gradient="from-purple-500 to-indigo-400"
          />
          <StatCard
            value={stats.totalDocuments}
            label="Documents Processed"
            gradient="from-green-500 to-emerald-400"
          />
          <StatCard
            value={stats.recentConversations}
            label="Recent Conversations"
            gradient="from-blue-500 to-cyan-400"
          />
          <StatCard
            value={stats.activeDocumentsCount}
            label="Active Documents"
            gradient="from-yellow-500 to-orange-400"
          />
        </section>
      )}

      {/* Search */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations by title or message content..."
            className="flex-1 border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="space-y-4">
        {conversationsLoading ? (
          <div className="text-center text-gray-500">
            Loading conversations...
          </div>
        ) : conversationsError ? (
          <div className="text-center text-red-500">
            Failed to load conversations
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-500">
            No conversations found
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationCard
              key={conversation._id}
              conversation={conversation}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-gray-700 dark:text-gray-300">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

/* Reusable Stat Card */
const StatCard = ({ value, label, gradient }) => {
  return (
    <div
      className={`p-6 text-center bg-gradient-to-tr ${gradient} text-white rounded-lg shadow-lg hover:scale-[1.02] transition duration-200`}
    >
      <div className="text-4xl font-extrabold drop-shadow mb-1">
        {value}
      </div>
      <div className="text-sm font-medium opacity-90">{label}</div>
    </div>
  );
};

export default Conversation;