import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

import { buildApiUrl } from '../../api/apiBaseUrl';
import { supabase } from '../../api/supabaseClient';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { Profile } from '../profile/types';
import { CommentSection } from './components/CommentSection';
import { CATEGORIES, Post, formatRelativeTime } from './types';

interface PostDetailPageProps {
  user: User | null;
  profile: Profile | null;
}

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
    if (!postId) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    const loadPost = async () => {
      setIsLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = user ? session?.access_token : null;
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await fetch(buildApiUrl(`/api/v1/community/posts/${postId}`), {
          signal: controller.signal,
          headers,
        });

        const data = response.ok ? ((await response.json()) as Post) : null;
        if (!isActive) {
          return;
        }

        setPost(data);

        if (!data || shouldSkipViewTracking(postId)) {
          return;
        }

        recentViewRequests.set(postId, Date.now());

        const incrementResponse = await fetch(buildApiUrl(`/api/v1/community/posts/${postId}/views`), {
          method: 'POST',
          signal: controller.signal,
        });

        if (!incrementResponse.ok) {
          recentViewRequests.delete(postId);
          return;
        }

        if (isActive) {
          setPost((currentPost) =>
            currentPost ? { ...currentPost, views: currentPost.views + 1 } : currentPost,
          );
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
  const categoryLabel = post ? CATEGORIES[post.category] || post.category : '';
  const authorLabel = post
    ? post.author.rank
      ? `${post.author.rank} ${post.author.nickname}`
      : post.author.nickname
    : '';

  const handleDelete = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        return;
      }

      const response = await fetch(buildApiUrl(`/api/v1/community/posts/${postId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        navigate('/Community');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!postId) {
      return;
    }

    if (!user) {
      alert('추천과 비추천은 로그인 후 이용할 수 있습니다.');
      return;
    }

    setIsVoting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('로그인 세션을 확인할 수 없습니다. 다시 로그인해 주세요.');
        return;
      }

      const response = await fetch(buildApiUrl(`/api/v1/community/posts/${postId}/vote`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vote_type: voteType }),
      });

      if (!response.ok) {
        throw new Error('추천 상태를 변경하지 못했습니다.');
      }

      const data = await response.json();
      setPost((currentPost) =>
        currentPost
          ? {
              ...currentPost,
              upvotes: data.upvotes,
              downvotes: data.downvotes,
              viewer_vote: data.viewer_vote,
            }
          : currentPost,
      );
    } catch (error) {
      console.error(error);
      alert('추천 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 text-center text-on-surface-variant dark:text-slate-400">
        <span className="material-symbols-outlined mb-2 block animate-pulse text-4xl">article</span>
        불러오는 중...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="py-32 text-center text-on-surface-variant dark:text-slate-400">
        <span className="material-symbols-outlined mb-2 block text-4xl">error</span>
        게시글을 찾을 수 없습니다.
        <button onClick={() => navigate('/Community')} className="mx-auto mt-4 block text-sm text-primary hover:underline">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={() => navigate('/Community')}
        className="mb-6 flex items-center gap-1 text-sm text-on-surface-variant transition-colors hover:text-primary dark:text-slate-400"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        목록으로
      </button>

      <article className="overflow-hidden rounded-xl bg-surface-container-lowest dark:bg-slate-800">
        <header className="border-b border-outline-variant/15 p-5 dark:border-slate-700 sm:p-8 md:p-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-primary">
              {categoryLabel}
            </span>
            <span className="text-sm text-on-surface-variant dark:text-slate-400">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
          <h1 className="mb-6 text-2xl font-extrabold leading-tight tracking-tight text-on-surface dark:text-white sm:text-3xl md:mb-8 md:text-4xl">
            {post.title}
          </h1>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                nickname={post.author.nickname}
                rank={post.author.rank}
                avatar_url={post.author.avatar_url}
                containerClassName="h-12 w-12 overflow-hidden rounded-full"
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

            {isOwner ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate(`/Community/${post.id}/edit`)}
                  className="flex items-center gap-1 rounded-full bg-surface-container-low px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  삭제
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="p-5 sm:p-8 md:p-12">
          <div className="whitespace-pre-wrap text-base leading-relaxed text-on-surface dark:text-slate-200">
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

      <CommentSection postId={post.id} profile={profile} currentUserId={user?.id ?? null} />
    </div>
  );
};
