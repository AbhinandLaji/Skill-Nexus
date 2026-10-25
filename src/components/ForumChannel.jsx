import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const dateLabel = (value) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function ForumChannel({ channelId }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [replies, setReplies] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.getForumPosts(channelId).then((items) => { if (active) setPosts(items); })
      .catch((loadError) => { if (active) setError(loadError.message || 'Could not load forum posts.'); });
    return () => { active = false; };
  }, [channelId]);

  const createPost = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const post = await api.createForumPost(channelId, { title, body });
      setPosts((current) => [post, ...current]); setTitle(''); setBody('');
    } catch (postError) { setError(postError.message || 'Could not create post.'); }
    finally { setBusy(false); }
  };

  const submitReply = async (event, postId) => {
    event.preventDefault();
    const text = (replies[postId] || '').trim();
    if (!text) return;
    setBusy(true); setError('');
    try {
      const updated = await api.replyToForumPost(channelId, postId, text);
      setPosts((current) => current.map((post) => post.id === postId ? updated : post));
      setReplies((current) => ({ ...current, [postId]: '' }));
    } catch (replyError) { setError(replyError.message || 'Could not add reply.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
      <form onSubmit={createPost} className="rounded-xl bg-surface-container border border-white/[0.08] p-4 space-y-3">
        <h2 className="font-semibold text-on-surface">Start a discussion</h2>
        <input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Discussion title" className="w-full rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface" />
        <textarea required maxLength={12000} rows={3} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Add context, a question, or details…" className="w-full resize-y rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface" />
        <div className="flex justify-end"><button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm text-on-primary disabled:opacity-50">Post</button></div>
      </form>
      {error && <p role="alert" className="rounded-lg bg-error-container/20 p-3 text-sm text-error">{error}</p>}
      {posts.length === 0 ? <p className="py-10 text-center text-sm text-on-surface-variant">No discussions yet. Start the first one.</p> : posts.map((post) => (
        <article key={post.id} className="rounded-xl bg-surface-container border border-white/[0.08] p-4 sm:p-5">
          <div className="flex justify-between gap-4"><div><h3 className="text-lg font-semibold text-on-surface">{post.title}</h3><p className="mt-1 text-xs text-on-surface-variant">{post.authorName} · {dateLabel(post.createdAt)}</p></div><span className="text-xs text-on-surface-variant">{post.replies.length} replies</span></div>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm text-on-surface-variant">{post.body}</p>
          {post.replies.length > 0 && <div className="mt-4 space-y-3 border-l-2 border-primary/25 pl-4">{post.replies.map((reply) => <div key={reply.id}><p className="text-xs font-semibold text-on-surface">{reply.authorName}<span className="ml-2 font-normal text-on-surface-variant">{dateLabel(reply.createdAt)}</span></p><p className="mt-1 whitespace-pre-wrap text-sm text-on-surface-variant">{reply.text}</p></div>)}</div>}
          <form onSubmit={(event) => submitReply(event, post.id)} className="mt-4 flex gap-2"><input maxLength={4000} value={replies[post.id] || ''} onChange={(event) => setReplies((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Write a reply…" className="min-w-0 flex-1 rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface" /><button disabled={busy || !(replies[post.id] || '').trim()} className="rounded-lg bg-surface-container-high px-3 py-2 text-sm text-on-surface disabled:opacity-40">Reply</button></form>
        </article>
      ))}
    </div>
  );
}
