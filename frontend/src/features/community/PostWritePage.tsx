import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { Profile } from '../profile/types';
import { supabase } from '../../api/supabaseClient';

interface PostWritePageProps {
  user: User | null;
  profile: Profile | null;
}

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

  // 비로그인 또는 프로필 없으면 커뮤니티로 리다이렉트
  useEffect(() => {
    if (!user || !profile) {
      navigate('/Community');
    }
  }, [user, profile, navigate]);

  // 수정 모드: 기존 데이터 불러오기
  useEffect(() => {
    if (!isEditMode || !postId) return;
    fetch(`${apiUrl}/api/v1/community/posts/${postId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setCategory(data.category);
        }
      });
  }, [isEditMode, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('로그인이 필요합니다.'); return; }

      const payload = { title: title.trim(), content: content.trim(), category };
      const url = isEditMode
        ? `${apiUrl}/api/v1/community/posts/${postId}`
        : `${apiUrl}/api/v1/community/posts`;
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const targetId = isEditMode ? postId : data.id;
        navigate(targetId ? `/Community/${targetId}` : '/Community');
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.detail || '저장 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-10">
        <span className="text-primary font-semibold tracking-wider text-sm mb-3 block">
          {isEditMode ? 'EDIT POST' : 'NEW POST'}
        </span>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-on-surface dark:text-white">
          {isEditMode ? '게시글 수정' : <>새로운 소식을 <span className="text-primary">커뮤니티</span>에 공유하세요</>}
        </h1>
      </div>

      {/* 폼 */}
      <div className="bg-surface-container-low dark:bg-slate-900 rounded-xl p-1 md:p-8">
        <form
          onSubmit={handleSubmit}
          className="bg-surface-container-lowest dark:bg-slate-800 rounded-xl p-8 shadow-[0_12px_40px_rgba(27,28,28,0.06)] space-y-6"
        >
          {/* 카테고리 */}
          <div>
            <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-2 ml-1">
              카테고리
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-slate-700 border-none focus:ring-1 focus:ring-primary rounded-xl px-6 py-3 text-on-surface dark:text-white outline-none appearance-none"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 제목 */}
          <div>
            <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-2 ml-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="w-full bg-surface-container-low dark:bg-slate-700 border-none focus:ring-1 focus:ring-primary rounded-xl px-6 py-4 text-lg text-on-surface dark:text-white placeholder-slate-400 outline-none"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="text-sm font-semibold text-on-surface-variant dark:text-slate-400 block mb-2 ml-1">
              내용 <span className="text-red-500">*</span>
            </label>
            <div className="bg-surface-container-low dark:bg-slate-700 rounded-xl overflow-hidden">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={12}
                className="w-full bg-transparent border-none focus:ring-0 px-6 py-6 text-base leading-relaxed resize-none text-on-surface dark:text-white placeholder-slate-400 outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* 버튼 */}
          <div className="flex flex-col md:flex-row items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-surface-container-high dark:bg-slate-700 text-on-surface dark:text-white font-semibold rounded-full px-10 py-4 hover:bg-surface-container-highest dark:hover:bg-slate-600 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-br from-primary to-primary-container text-white px-16 py-4 font-bold rounded-full shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '저장 중...' : isEditMode ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
