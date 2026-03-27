import React, { useState, useEffect } from 'react';
import { ProfileAvatar } from '../../../components/common/ProfileAvatar';
import { Comment, formatRelativeTime } from '../types';
import { Profile } from '../../profile/types';
import { supabase } from '../../../api/supabaseClient';

interface CommentSectionProps {
  postId: string;
  profile: Profile | null;
  currentUserId: string | null;
}

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, profile, currentUserId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/community/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch(`${apiUrl}/api/v1/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        setNewComment('');
        await fetchComments();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      await fetch(`${apiUrl}/api/v1/community/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="mt-12 bg-surface-container-lowest dark:bg-slate-800 rounded-xl p-8">
      <h3 className="text-lg font-bold text-on-surface dark:text-white mb-6">
        댓글 <span className="text-primary">{comments.length}</span>
      </h3>

      {/* 댓글 입력 (로그인 + 프로필 있을 때만) */}
      {profile ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-8">
          {/* 아바타 */}
          <ProfileAvatar
            nickname={profile.nickname}
            rank={profile.rank}
            avatar_url={profile.avatar_url}
            containerClassName="w-10 h-10 rounded-full overflow-hidden shrink-0"
          />
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={3}
              className="w-full bg-surface-container-low dark:bg-slate-700 border-none rounded-xl p-4 focus:ring-1 focus:ring-primary focus:bg-white dark:focus:bg-slate-600 transition-all text-sm text-on-surface dark:text-white placeholder-slate-400 outline-none resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="px-6 py-2 bg-primary text-white rounded-full font-semibold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                {isSubmitting ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-on-surface-variant dark:text-slate-400 mb-8 text-center py-4 bg-surface-container-low dark:bg-slate-700 rounded-xl">
          댓글을 작성하려면 로그인이 필요합니다.
        </p>
      )}

      {/* 댓글 목록 */}
      {isLoading ? (
        <p className="text-sm text-on-surface-variant dark:text-slate-400 text-center py-4">로딩 중...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-on-surface-variant dark:text-slate-400 text-center py-8">
          아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => {
            const isOwner = currentUserId === comment.author.id;
            const authorLabel = comment.author.rank
              ? `${comment.author.rank} ${comment.author.nickname}`
              : comment.author.nickname;
            return (
              <div key={comment.id} className="flex gap-4">
                {/* 아바타 */}
                <ProfileAvatar
                  nickname={comment.author.nickname}
                  rank={comment.author.rank}
                  avatar_url={comment.author.avatar_url}
                  containerClassName="w-10 h-10 rounded-full overflow-hidden shrink-0"
                  fallbackClassName="bg-surface-container-high dark:bg-slate-600 text-on-surface-variant dark:text-slate-300 text-sm font-bold"
                />
                {/* 내용 */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-on-surface dark:text-white">{authorLabel}</span>
                      <span className="text-xs text-on-surface-variant dark:text-slate-400">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface-variant dark:text-slate-300 mt-1">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
