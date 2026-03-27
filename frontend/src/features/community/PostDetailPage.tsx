import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { Profile } from '../../components/common/ProfileSetupModal';
import { CommentSection } from './components/CommentSection';
import { Post, CATEGORIES, formatRelativeTime } from './types';
import { supabase } from '../../api/supabaseClient';

interface PostDetailPageProps {
  user: User | null;
  profile: Profile | null;
}

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const VIEW_TRACK_TTL_MS = 3000;
const recentViewRequests = new Map<string, number>();

const shouldSkipViewTracking = (postId: string) => {
  const lastRequestedAt = recentViewRequests.get(postId);
  if (!lastRequestedAt) {
    return false;
  }

  return Date.now() - lastRequestedAt < VIEW_TRACK_TTL_MS;
};

export const PostDetailPage: React.FC<PostDetailPageProps> = ({ user, profile }) => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (!postId) return;
    const controller = new AbortController();
    let isActive = true;

    const loadPost = async () => {
      setIsLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = user ? session?.access_token : null;
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const res = await fetch(`${apiUrl}/api/v1/community/posts/${postId}`, {
          signal: controller.signal,
          headers,
        });

        const data = res.ok ? await res.json() : null;
        if (!isActive) {
          return;
        }

        setPost(data);

        if (!data || shouldSkipViewTracking(postId)) {
          return;
        }

        recentViewRequests.set(postId, Date.now());

        const incrementRes = await fetch(`${apiUrl}/api/v1/community/posts/${postId}/views`, {
          method: 'POST',
          signal: controller.signal,
        });

        if (!incrementRes.ok) {
          recentViewRequests.delete(postId);
          return;
        }

        if (isActive) {
          setPost((currentPost) => (
            currentPost
              ? { ...currentPost, views: currentPost.views + 1 }
              : currentPost
          ));
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.error(error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadPost();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [postId, user]);

  const isOwner = user && post && user.id === post.author.id;
  const categoryLabel = post ? (CATEGORIES[post.category] || post.category) : '';
  const authorLabel = post
    ? (post.author.rank ? `${post.author.rank} ${post.author.nickname}` : post.author.nickname)
    : '';

  const handleDelete = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch(`${apiUrl}/api/v1/community/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) navigate('/Community');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!postId) {
      return;
    }

    if (!user) {
      alert('추천/비추천은 로그인 후 이용할 수 있습니다.');
      return;
    }

    setIsVoting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('로그인 세션을 확인할 수 없습니다. 다시 로그인해 주세요.');
        return;
      }

      const res = await fetch(`${apiUrl}/api/v1/community/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      if (!res.ok) {
        throw new Error('추천 상태를 변경하지 못했습니다.');
      }

      const data = await res.json();
      setPost((currentPost) => (
        currentPost
          ? {
              ...currentPost,
              upvotes: data.upvotes,
              downvotes: data.downvotes,
              viewer_vote: data.viewer_vote,
            }
          : currentPost
      ));
    } catch (error) {
      console.error(error);
      alert('추천 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-32 text-on-surface-variant dark:text-slate-400">
        <span className="material-symbols-outlined text-4xl mb-2 block animate-pulse">article</span>
        불러오는 중...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-32 text-on-surface-variant dark:text-slate-400">
        <span className="material-symbols-outlined text-4xl mb-2 block">error</span>
        게시글을 찾을 수 없습니다.
        <button onClick={() => navigate('/Community')} className="block mx-auto mt-4 text-primary hover:underline text-sm">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/Community')}
        className="flex items-center gap-1 text-sm text-on-surface-variant dark:text-slate-400 hover:text-primary transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        목록으로
      </button>

      <article className="bg-surface-container-lowest dark:bg-slate-800 rounded-xl overflow-hidden">
        {/* 게시글 헤더 */}
        <header className="p-8 md:p-12 border-b border-outline-variant/15 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold tracking-wider">
              {categoryLabel}
            </span>
            <span className="text-on-surface-variant dark:text-slate-400 text-sm">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface dark:text-white mb-8 leading-tight">
            {post.title}
          </h1>
          {/* 작성자 정보 + 수정/삭제 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                nickname={post.author.nickname}
                rank={post.author.rank}
                avatar_url={post.author.avatar_url}
                containerClassName="w-12 h-12 rounded-full overflow-hidden"
              />
              <div>
                <p className="font-bold text-on-surface dark:text-white">{authorLabel}</p>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    {post.views}
                  </span>
                </div>
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/Community/${post.id}/edit`)}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-on-surface-variant dark:text-slate-400 bg-surface-container-low dark:bg-slate-700 rounded-full hover:bg-surface-container-high dark:hover:bg-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  삭제
                </button>
              </div>
            )}
          </div>
        </header>

        {/* 본문 */}
        <div className="p-8 md:p-12">
          <div className="whitespace-pre-wrap text-on-surface dark:text-slate-200 leading-relaxed text-base">
            {post.content}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 border-t border-outline-variant/15 pt-8 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleVote('up')}
              disabled={isVoting}
              className={`flex min-w-[132px] items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${
                post.viewer_vote === 'up'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-200'
                  : 'border-outline-variant/30 bg-surface-container-low text-on-surface dark:border-slate-700 dark:bg-slate-700 dark:text-white'
              } ${isVoting ? 'cursor-not-allowed opacity-60' : 'hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-300'}`}
            >
              <span className="material-symbols-outlined text-[18px]">thumb_up</span>
              추천 {post.upvotes}
            </button>

            <button
              type="button"
              onClick={() => handleVote('down')}
              disabled={isVoting}
              className={`flex min-w-[132px] items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors ${
                post.viewer_vote === 'down'
                  ? 'border-red-500 bg-red-50 text-red-600 dark:border-red-400 dark:bg-red-500/10 dark:text-red-200'
                  : 'border-outline-variant/30 bg-surface-container-low text-on-surface dark:border-slate-700 dark:bg-slate-700 dark:text-white'
              } ${isVoting ? 'cursor-not-allowed opacity-60' : 'hover:border-red-400 hover:text-red-500 dark:hover:text-red-300'}`}
            >
              <span className="material-symbols-outlined text-[18px]">thumb_down</span>
              비추천 {post.downvotes}
            </button>
          </div>
        </div>
      </article>

      {/* 댓글 섹션 */}
      <CommentSection
        postId={post.id}
        profile={profile}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
};
