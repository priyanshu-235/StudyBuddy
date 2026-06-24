import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import AlertBanner from './AlertBanner';
import { getErrorMessage } from '../utils/getErrorMessage';

const panelCardClass =
  'rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-800/80 to-slate-900/90 shadow-[inset_0_1px_0_rgba(52,211,153,0.08),0_4px_20px_rgba(0,0,0,0.35)]';

const inputClass =
  'w-full px-3 py-2 text-sm rounded-lg border border-emerald-500/25 bg-slate-800/60 text-slate-200 outline-none transition-all focus:border-emerald-400/50 focus:shadow-[0_0_14px_rgba(52,211,153,0.12)]';

const THREAD_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'solution', label: 'Solution' },
  { value: 'blog', label: 'Blog' },
];

const TYPE_STYLES = {
  discussion: 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10',
  solution: 'border-teal-400/40 text-teal-300 bg-teal-500/10',
  blog: 'border-amber-400/40 text-amber-300 bg-amber-500/10',
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function Discussions({ problemId }) {
  const { user } = useSelector((state) => state.auth);
  const [view, setView] = useState('list');
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newThread, setNewThread] = useState({
    title: '',
    content: '',
    type: 'discussion',
  });
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(`/discussion/${problemId}/threads`, {
        params: { type: filterType, sort: sortBy, page, limit: 10 },
      });
      setThreads(data.threads);
      setTotalPages(data.totalPages);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Failed to load discussions'));
    } finally {
      setLoading(false);
    }
  }, [problemId, filterType, sortBy, page]);

  useEffect(() => {
    if (view === 'list') {
      fetchThreads();
    }
  }, [view, fetchThreads]);

  const openThread = async (threadId) => {
    try {
      setDetailLoading(true);
      setView('detail');
      const { data } = await axiosClient.get(`/discussion/thread/${threadId}`);
      setSelectedThread(data.thread);
      setComments(data.comments);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Failed to load thread'));
      setView('list');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateThread = async (event) => {
    event.preventDefault();
    if (!newThread.title.trim() || !newThread.content.trim()) return;

    try {
      setSubmitting(true);
      setActionError(null);
      await axiosClient.post(`/discussion/${problemId}/threads`, newThread);
      setNewThread({ title: '', content: '', type: 'discussion' });
      setShowCreateForm(false);
      setPage(1);
      setSuccessMessage('Thread created successfully');
      await fetchThreads();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to create thread'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();
    if (!newComment.trim() || !selectedThread) return;

    try {
      setSubmitting(true);
      const { data } = await axiosClient.post(
        `/discussion/thread/${selectedThread._id}/comments`,
        { content: newComment }
      );
      setComments((prev) => [...prev, data]);
      setNewComment('');
      setSelectedThread((prev) => ({
        ...prev,
        commentCount: (prev.commentCount || comments.length) + 1,
      }));
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to add comment'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleThreadUpvote = async () => {
    if (!selectedThread) return;

    try {
      const { data } = await axiosClient.post(
        `/discussion/thread/${selectedThread._id}/upvote`
      );
      setSelectedThread((prev) => ({
        ...prev,
        upvoteCount: data.upvoteCount,
        hasUpvoted: data.hasUpvoted,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleListThreadUpvote = async (threadId, event) => {
    event.stopPropagation();

    try {
      const { data } = await axiosClient.post(`/discussion/thread/${threadId}/upvote`);
      setThreads((prev) =>
        prev.map((thread) =>
          thread._id === threadId
            ? { ...thread, upvoteCount: data.upvoteCount, hasUpvoted: data.hasUpvoted }
            : thread
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentUpvote = async (commentId) => {
    try {
      const { data } = await axiosClient.post(`/discussion/comment/${commentId}/upvote`);
      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? { ...comment, upvoteCount: data.upvoteCount, hasUpvoted: data.hasUpvoted }
            : comment
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteThread = async () => {
    if (!selectedThread || !window.confirm('Delete this thread and all its comments?')) return;

    try {
      await axiosClient.delete(`/discussion/thread/${selectedThread._id}`);
      setView('list');
      setSelectedThread(null);
      setComments([]);
      fetchThreads();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Failed to delete thread'));
    }
  };

  const canDeleteThread =
    selectedThread &&
    (user?._id === selectedThread.user?._id || user?.role === 'admin');

  if (view === 'detail') {
    if (detailLoading || !selectedThread) {
      return (
        <div className="flex justify-center items-center h-48">
          <span className="loading loading-spinner loading-lg text-emerald-400"></span>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            setView('list');
            setSelectedThread(null);
            setComments([]);
          }}
          className="text-sm text-slate-400 hover:text-emerald-200 transition-colors flex items-center gap-1"
        >
          ← Back to discussions
        </button>

        <div className={`${panelCardClass} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${TYPE_STYLES[selectedThread.type]}`}>
                  {selectedThread.type}
                </span>
                <span className="text-xs text-slate-500">{formatDate(selectedThread.createdAt)}</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-100">{selectedThread.title}</h3>
              <p className="text-sm text-slate-500 mt-1">by {selectedThread.user?.firstName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleThreadUpvote}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  selectedThread.hasUpvoted
                    ? 'border-emerald-400/50 text-emerald-300 bg-emerald-500/15'
                    : 'border-emerald-500/25 text-slate-400 hover:border-emerald-400/40 hover:text-emerald-200'
                }`}
              >
                ▲ {selectedThread.upvoteCount}
              </button>
              {canDeleteThread && (
                <button
                  type="button"
                  onClick={handleDeleteThread}
                  className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-300 text-sm hover:bg-rose-500/10"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300 border-t border-emerald-500/10 pt-4">
            {selectedThread.content}
          </div>
        </div>

        <div className={`${panelCardClass} p-5`}>
          <h4 className="text-sm font-semibold text-emerald-300/90 mb-4">
            Comments ({comments.length})
          </h4>

          {comments.length === 0 ? (
            <p className="text-slate-500 italic text-sm mb-4">No comments yet. Start the conversation.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  className="p-3 rounded-lg bg-slate-950/40 border border-emerald-500/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 mb-1">
                        {comment.user?.firstName} · {formatDate(comment.createdAt)}
                      </p>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCommentUpvote(comment._id)}
                      className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-xs border transition-all ${
                        comment.hasUpvoted
                          ? 'border-emerald-400/50 text-emerald-300 bg-emerald-500/15'
                          : 'border-emerald-500/20 text-slate-500 hover:text-emerald-200'
                      }`}
                    >
                      ▲ {comment.upvoteCount}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="space-y-3 border-t border-emerald-500/10 pt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-emerald-400/50 text-slate-900 bg-gradient-to-b from-emerald-400 to-teal-500 disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AlertBanner type="error" message={actionError} onDismiss={() => setActionError(null)} />
      <AlertBanner type="success" message={successMessage} onDismiss={() => setSuccessMessage(null)} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {THREAD_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setFilterType(value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                filterType === value
                  ? 'border-emerald-400/50 text-emerald-300 bg-emerald-500/10'
                  : 'border-emerald-500/20 text-slate-400 hover:border-emerald-400/30'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-emerald-400/50 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
        >
          {showCreateForm ? 'Cancel' : '+ New Thread'}
        </button>
      </div>

      <div className="flex gap-2">
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          className={inputClass + ' w-auto'}
        >
          <option value="recent">Most Recent</option>
          <option value="upvotes">Most Upvoted</option>
        </select>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateThread} className={`${panelCardClass} p-5 space-y-4`}>
          <h4 className="text-sm font-semibold text-emerald-300/90">Create a Thread</h4>
          <input
            type="text"
            value={newThread.title}
            onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
            placeholder="Thread title"
            className={inputClass}
            maxLength={200}
          />
          <select
            value={newThread.type}
            onChange={(e) => setNewThread({ ...newThread, type: e.target.value })}
            className={inputClass}
          >
            <option value="discussion">Discussion</option>
            <option value="solution">Solution</option>
            <option value="blog">Blog</option>
          </select>
          <textarea
            value={newThread.content}
            onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
            placeholder="Write your post..."
            rows={6}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-emerald-400/50 text-slate-900 bg-gradient-to-b from-emerald-400 to-teal-500 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Thread'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <span className="loading loading-spinner loading-lg text-emerald-400"></span>
        </div>
      ) : error ? (
        <AlertBanner type="error" message={error} />
      ) : threads.length === 0 ? (
        <div className={`${panelCardClass} p-8 text-center`}>
          <p className="text-slate-500 italic">No discussions yet.</p>
          <p className="text-slate-600 text-sm mt-2">Be the first to start a thread!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <div
              key={thread._id}
              role="button"
              tabIndex={0}
              onClick={() => openThread(thread._id)}
              onKeyDown={(e) => e.key === 'Enter' && openThread(thread._id)}
              className={`${panelCardClass} p-4 w-full text-left transition-all hover:border-emerald-400/35 cursor-pointer`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${TYPE_STYLES[thread.type]}`}>
                      {thread.type}
                    </span>
                    <span className="text-xs text-slate-500">
                      {thread.user?.firstName} · {formatDate(thread.createdAt)}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-100 truncate">{thread.title}</h4>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{thread.content}</p>
                  <p className="text-xs text-slate-500 mt-2">{thread.commentCount} comment{thread.commentCount !== 1 ? 's' : ''}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleListThreadUpvote(thread._id, e)}
                  className={`shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border text-xs transition-all ${
                    thread.hasUpvoted
                      ? 'border-emerald-400/50 text-emerald-300 bg-emerald-500/15'
                      : 'border-emerald-500/20 text-slate-500 hover:text-emerald-200'
                  }`}
                >
                  <span>▲</span>
                  <span>{thread.upvoteCount}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-emerald-500/25 text-slate-400 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-emerald-500/25 text-slate-400 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Discussions;
