import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

import { buildApiUrl } from '../../api/apiBaseUrl';
import { supabase } from '../../api/supabaseClient';
import { Profile } from '../profile/types';

interface PostWritePageProps {
  user: User | null;
  profile: Profile | null;
}

const CATEGORY_OPTIONS = [
  { value: 'general', label: '자유게시판' },
  { value: 'question', label: '질문게시판' },
  { value: 'info', label: '정보공유' },
];

export const PostWritePage: React.FC<PostWritePageProps> = ({ user, profile }) => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId?: string }>();
  const isEditMode = !!postId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !profile) {
      navigate('/Community');
    }
  }, [navigate, profile, user]);

  useEffect(() => {
    if (!isEditMode || !postId) {
      return;
    }

    fetch(buildApiUrl(`/api/v1/community/posts/${postId}`))
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) {
          return;
        }

        setTitle(data.title);
        setContent(data.content);
        setCategory(data.category);
      });
  }, [isEditMode, postId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('로그인이 필요합니다.');
        return;
      }

      const payload = { title: title.trim(), content: content.trim(), category };
      const url = isEditMode
        ? buildApiUrl(`/api/v1/community/posts/${postId}`)
        : buildApiUrl('/api/v1/community/posts');
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const targetId = isEditMode ? postId : data.id;
        navigate(targetId ? `/Community/${targetId}` : '/Community');
        return;
      }

      const payloadError = await response.json().catch(() => ({}));
      setError(payloadError.detail || '저장 중 오류가 발생했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 sm:mb-10">
        <span className="mb-3 block text-sm font-semibold tracking-wider text-primary">
          {isEditMode ? 'EDIT POST' : 'NEW POST'}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface dark:text-white sm:text-4xl md:text-5xl">
          {isEditMode ? (
            '게시글 수정'
          ) : (
            <>
              새로운 소식을 <span className="text-primary">커뮤니티</span>에 공유하세요
            </>
          )}
        </h1>
      </div>

      <div className="rounded-xl bg-surface-container-low p-1 dark:bg-slate-900 md:p-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl bg-surface-container-lowest p-5 shadow-[0_12px_40px_rgba(27,28,28,0.06)] dark:bg-slate-800 sm:p-6 md:p-8"
        >
          <div>
            <label className="mb-2 ml-1 block text-sm font-semibold text-on-surface-variant dark:text-slate-400">
              카테고리
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full appearance-none rounded-xl border-none bg-surface-container-low px-6 py-3 text-on-surface outline-none focus:ring-1 focus:ring-primary dark:bg-slate-700 dark:text-white"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 ml-1 block text-sm font-semibold text-on-surface-variant dark:text-slate-400">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="w-full rounded-xl border-none bg-surface-container-low px-6 py-4 text-lg text-on-surface outline-none focus:ring-1 focus:ring-primary dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block text-sm font-semibold text-on-surface-variant dark:text-slate-400">
              내용 <span className="text-red-500">*</span>
            </label>
            <div className="overflow-hidden rounded-xl bg-surface-container-low dark:bg-slate-700">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="내용을 입력하세요"
                rows={12}
                className="w-full resize-none border-none bg-transparent px-6 py-6 text-base leading-relaxed text-on-surface outline-none focus:ring-0 dark:text-white dark:placeholder:text-slate-400"
              />
            </div>
          </div>

          {error ? <p className="text-center text-sm text-red-500">{error}</p> : null}

          <div className="flex flex-col items-stretch justify-end gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full bg-surface-container-high px-8 py-4 font-semibold text-on-surface transition-colors hover:bg-surface-container-highest dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 sm:px-10"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-gradient-to-br from-primary to-primary-container px-10 py-4 font-bold text-white shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-16"
            >
              {isSubmitting ? '저장 중...' : isEditMode ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
