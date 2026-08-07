import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '../utils/getErrorMessage';
import { streamAiChat } from '../utils/streamAiChat';
import AlertBanner from './AlertBanner';
import ChatMessageContent from './ChatMessageContent';
import { Send } from 'lucide-react';

const INITIAL_MESSAGE = {
  role: 'model',
  parts: [{ text: 'Hi! Ask me anything about this problem — hints, code review, or approach guidance.' }],
};

function ChatAi({ problem, user }) {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [chatError, setChatError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [maxCallsExceeded, setMaxCallsExceeded] = useState(false);
  const [remainingCalls, setRemainingCalls] = useState(5);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (user?.aiChatCalls !== undefined) {
      // Admins have unlimited AI calls
      if (user.role === 'admin') {
        setRemainingCalls('∞');
        setMaxCallsExceeded(false);
      } else {
        const maxCalls = 5; // This should match the backend AI_MAX_TOTAL_CALLS
        const remaining = maxCalls - user.aiChatCalls;
        setRemainingCalls(remaining);
        setMaxCallsExceeded(remaining <= 0);
      }
    }
  }, [user]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const appendToLastAssistant = (chunk) => {
    setMessages((prev) => {
      const next = [...prev];
      const lastIndex = next.length - 1;
      const last = next[lastIndex];

      if (last?.role !== 'model') {
        return [...next, { role: 'model', parts: [{ text: chunk }] }];
      }

      next[lastIndex] = {
        ...last,
        parts: [{ text: `${last.parts[0]?.text || ''}${chunk}` }],
      };

      return next;
    });
  };

  const onSubmit = async (data) => {
    const userMessage = {
      role: 'user',
      parts: [{ text: data.message }],
    };

    const updatedMessages = [...messages, userMessage];

    setMessages([...updatedMessages, { role: 'model', parts: [{ text: '' }] }]);
    reset();
    setChatError(null);
    setIsStreaming(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      await streamAiChat(
        {
          messages: updatedMessages,
          title: problem.title,
          description: problem.description,
          testCases: problem.visibleTestCases,
          startCode: problem.startCode,
        },
        {
          signal: abortRef.current.signal,
          onChunk: appendToLastAssistant,
          onError: (message) => {
            throw new Error(message);
          },
        }
      );
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }

      console.error('AI stream error:', error);
      
      let errorMessage;
      
      // Check if it's a max calls exceeded error
      if (error.response?.data?.error === 'Maximum AI calls exceeded') {
        setMaxCallsExceeded(true);
        errorMessage = error.response.data.message || 'You have exceeded the maximum limit of AI chat calls.';
      } else {
        errorMessage = getErrorMessage(error, 'Failed to get a response from AI');
      }
      
      setChatError(errorMessage);

      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];

        if (last?.role === 'model' && !last.parts[0]?.text) {
          next[next.length - 1] = {
            role: 'model',
            parts: [{ text: errorMessage }],
          };
          return next;
        }

        return [...next, { role: 'model', parts: [{ text: errorMessage }] }];
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const isBusy = isStreaming || isSubmitting;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col h-screen max-h-[80vh] min-h-[500px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AlertBanner type="error" message={chatError} onDismiss={() => setChatError(null)} />

        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const text = msg.parts[0]?.text || '';
          const isLastAssistant =
            !isUser && index === messages.length - 1 && isStreaming;

          return (
            <div
              key={index}
              className={`chat ${isUser ? 'chat-end' : 'chat-start'}`}
            >
              <div
                className={`chat-bubble max-w-[92%] ${
                  isUser
                    ? 'bg-emerald-600/20 text-slate-100 border border-emerald-500/20'
                    : 'bg-slate-800/80 text-slate-200 border border-emerald-500/10'
                }`}
              >
                {isUser ? (
                  <p className="text-sm whitespace-pre-wrap">{text}</p>
                ) : (
                  <ChatMessageContent content={text} isStreaming={isLastAssistant} />
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="sticky bottom-0 p-4 bg-base-100 border-t border-emerald-500/10"
      >
        <div className="flex items-center gap-2">
          <input
            placeholder={
              !isAdmin && maxCallsExceeded 
                ? 'You have exceeded the maximum AI chat calls limit' 
                : isBusy 
                  ? 'Waiting for response…' 
                  : 'Ask for a hint, code review, or approach'
            }
            className="input input-bordered flex-1 bg-slate-900/40 border-emerald-500/20"
            disabled={isBusy || (!isAdmin && maxCallsExceeded)}
            {...register('message', { required: true, minLength: 2 })}
          />
          <button
            type="submit"
            className="btn btn-ghost text-emerald-300"
            disabled={isBusy || (!isAdmin && maxCallsExceeded) || !!errors.message}
          >
            {isBusy ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatAi;
