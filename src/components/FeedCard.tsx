import React, { useState } from 'react';
import type { GuestbookMessage } from '../types/guestbook';
import { formatRelativeTime, formatClockTime } from '../utils/date';
import { Heart, Copy, Check, Clock } from 'lucide-react';
import { likeGuestbookMessage } from '../firebase/guestbookService';

interface FeedCardProps {
  message: GuestbookMessage;
  isMyMessage?: boolean;
}

export const FeedCard: React.FC<FeedCardProps> = ({ message, isMyMessage }) => {
  const [copied, setCopied] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await likeGuestbookMessage(message.id);
    } catch (err) {
      console.error('좋아요 실패:', err);
    } finally {
      setTimeout(() => setIsLiking(false), 300);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getCardBg = () => {
    switch (message.bubbleColor) {
      case 'yellow':
        return 'bg-amber-50/80 border-amber-200 hover:border-amber-300';
      case 'pink':
        return 'bg-pink-50/80 border-pink-200 hover:border-pink-300';
      case 'blue':
        return 'bg-sky-50/80 border-sky-200 hover:border-sky-300';
      case 'green':
        return 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-300';
      case 'purple':
        return 'bg-purple-50/80 border-purple-200 hover:border-purple-300';
      default:
        return 'bg-white border-stone-200 hover:border-stone-300';
    }
  };

  return (
    <div
      className={`rounded-2xl p-4 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${getCardBg()}`}
    >
      <div>
        {/* 상단 프로필 및 작성 시각 */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-white/80 border border-stone-200/80 flex items-center justify-center text-base shadow-2xs">
              {message.avatar || '💬'}
            </span>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-stone-900 leading-tight">
                  {message.nickname}
                </span>
                {isMyMessage && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#FEE500] text-[#191919]">
                    나
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1 text-[11px] text-stone-500 mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                <span className="font-medium text-stone-600">
                  {formatRelativeTime(message.createdAt)}
                </span>
                <span>•</span>
                <span>{formatClockTime(message.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 본문 메시지 */}
        <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap break-words">
          {message.message}
        </p>
      </div>

      {/* 하단 인터랙션 영역 */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-200/60 text-xs">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full font-bold transition-all active:scale-90 ${
            (message.likes || 0) > 0
              ? 'bg-rose-100/80 text-rose-600'
              : 'text-stone-500 hover:text-rose-500 hover:bg-stone-100/60'
          } ${isLiking ? 'scale-110' : ''}`}
        >
          <Heart className={`w-3.5 h-3.5 ${(message.likes || 0) > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>{message.likes || 0}</span>
        </button>

        <button
          onClick={handleCopy}
          className="text-stone-500 hover:text-stone-800 flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-stone-100/60 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          <span className="text-[11px]">{copied ? '복사됨' : '복사'}</span>
        </button>
      </div>
    </div>
  );
};
