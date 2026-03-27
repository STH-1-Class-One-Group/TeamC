import React from 'react';
import { Post, CATEGORIES, formatRelativeTime } from '../types';

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const categoryLabel = CATEGORIES[post.category] || post.category;
  const authorLabel = post.author.rank
    ? `${post.author.rank} ${post.author.nickname}`
    : post.author.nickname;

  return (
    <div
      onClick={onClick}
      className="group bg-surface-container-lowest dark:bg-slate-800 hover:bg-surface-bright dark:hover:bg-slate-700 p-6 rounded-lg transition-all duration-300 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center cursor-pointer"
    >
      {/* 왼쪽: 카테고리 뱃지 + 제목 + 메타 */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {categoryLabel}
          </span>
        </div>
        <span className="text-base font-medium text-on-surface dark:text-white group-hover:text-primary transition-colors truncate">
          {post.title}
        </span>
        <div className="flex items-center gap-3 text-sm text-on-surface-variant dark:text-slate-400 mt-1">
          <span className="font-medium">{authorLabel}</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            {post.views}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">thumb_up</span>
            {post.upvotes}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">thumb_down</span>
            {post.downvotes}
          </span>
        </div>
      </div>

      {/* 오른쪽: 날짜 */}
      <span className="text-on-surface-variant dark:text-slate-400 text-sm whitespace-nowrap mt-3 md:mt-0 md:ml-6 shrink-0">
        {formatRelativeTime(post.created_at)}
      </span>
    </div>
  );
};
