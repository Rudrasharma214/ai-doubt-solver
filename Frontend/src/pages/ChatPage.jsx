import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, FileText, ArrowLeft, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useAskDoubtMutation, useDeleteConversationMessagesMutation } from '../hooks/Doubt/useMutation'
import { useConversationHistoryQuery } from '../hooks/Doubt/useQueries'
import toast from 'react-hot-toast'

const ChatPage = () => {
    const { documentId } = useParams()
    const navigate = useNavigate()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')

    const askDoubtMutation = useAskDoubtMutation()
    const deleteMessagesMutation = useDeleteConversationMessagesMutation()
    const { data: conversationHistory, isLoading: historyLoading } = useConversationHistoryQuery(documentId)

    // conversationId returned inside conversationHistory.data
    const conversationId = conversationHistory?.data?.conversationId;
    // Load conversation history on mount
    useEffect(() => {
        if (conversationHistory?.data) {
            // Handle response structure: data.messages array
            const historyData = conversationHistory.data.messages ||
                (Array.isArray(conversationHistory.data) ? conversationHistory.data : [])

            const historyMessages = historyData.map((msg, index) => ({
                id: index,
                type: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.content
            }))
            setMessages(historyMessages)
        }
    }, [conversationHistory])

    const handleSendMessage = async () => {
        if (!input.trim()) return

        const question = input.trim()

        // Add user message
        setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: question }])
        setInput('')

        try {
            // Call the mutation to ask doubt
            const response = await askDoubtMutation.mutateAsync({
                documentId,
                question,
                language: 'en'
            })

            // Add AI response
            const aiResponse = response?.data?.answer || response?.answer || 'Unable to generate response'
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                type: 'ai',
                content: aiResponse
            }])
        } catch (error) {
            toast.error(error.message || 'Failed to get response')
            // Remove the user message if there was an error
            setMessages(prev => prev.slice(0, -1))
        }
    }

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent">
            <style>{`
                    .chat-scrollbar {
                        overflow-y: auto;
                        scrollbar-width: none;  
                        -ms-overflow-style: none;
                    }
                    .chat-scrollbar::-webkit-scrollbar {
                        display: none; 
                    }
                    `}</style>

            {/* Header */}
            <div className="px-4 sm:px-6 py-4">
                <div className="max-w-5xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                            onClick={() => navigate(-1)}
                            className="shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white break-words sm:truncate">
                                {conversationHistory?.data?.title || 'Start Conversation'}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
                                {conversationHistory?.data?.documentInfo?.name || ''}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={async () => {
                            if (!conversationId) return;
                            if (!window.confirm('Delete all messages in this conversation?')) return;

                            try {
                                await deleteMessagesMutation.mutateAsync(conversationId);
                                setMessages([]);
                                toast.success('Conversation cleared');
                            } catch (err) {
                                toast.error(err?.response?.data?.message || 'Failed to delete messages');
                            }
                        }}
                        disabled={deleteMessagesMutation.isPending}
                        className={`self-end sm:self-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${deleteMessagesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Trash2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 chat-scrollbar bg-transparent">
                <div className="max-w-5xl mx-auto w-full space-y-4">
                    {historyLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, index) => (
                                <div key={index} className="animate-pulse">
                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-16 mb-4"></div>
                                </div>
                            ))}
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full p-6">
                                <FileText className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Start a Conversation
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                                    Ask questions about your document to get AI-powered insights and answers.
                                </p>
                            </div>
                        </div>
                    ) : (
                        messages.map(message => (
                            <div
                                key={message.id}
                                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`w-full max-w-[92%] sm:max-w-md lg:max-w-2xl px-4 py-3 rounded-lg break-words ${message.type === 'user'
                                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-br-none'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                                        }`}
                                >
                                    {message.type === 'user' ? (
                                        <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
                                    ) : (
                                        <div className="text-sm sm:text-base leading-relaxed prose dark:prose-invert max-w-none text-gray-900 dark:text-gray-100">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ children }) => <p className="mb-2">{children}</p>,
                                                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                                    em: ({ children }) => <em className="italic">{children}</em>,
                                                    ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                                                    li: ({ children }) => <li className="mb-1">{children}</li>,
                                                    code: ({ children }) => (
                                                        <code className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-2 py-1 rounded text-xs font-mono">
                                                            {children}
                                                        </code>
                                                    ),
                                                    pre: ({ children }) => (
                                                        <pre className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-3 rounded-lg mb-2 overflow-x-auto">
                                                            {children}
                                                        </pre>
                                                    ),
                                                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                                                    blockquote: ({ children }) => (
                                                        <blockquote className="border-l-4 border-indigo-500 dark:border-indigo-400 pl-3 italic mb-2">
                                                            {children}
                                                        </blockquote>
                                                    ),
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {askDoubtMutation.isPending && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-lg rounded-bl-none space-y-2 max-w-[92%] sm:max-w-md lg:max-w-2xl">
                                <div className="flex space-x-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-transparent px-4 sm:px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur-sm">
                <div className="max-w-5xl mx-auto w-full">
                    <div className="flex flex-col gap-3 sm:flex-row sm:space-x-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask a question about your document..."
                            className="w-full min-w-0 flex-1 px-4 py-3 rounded-lg border border-gray-700 dark:bg-gray-800/50 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all backdrop-blur-sm"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={askDoubtMutation.isPending || !input.trim()}
                            className="w-full sm:w-auto px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                            <Send className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatPage