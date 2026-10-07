import React, { useState } from 'react';
import type { GuestbookMessage } from '../types/guestbook';
import { formatRelativeTime, formatClockTime } from '../utils/date';
import { Heart, Copy, Check } from 'lucide-react';
import { likeGuestbookMessage } from '../firebase/guestbookService';

interface ChatBubbleProps {
  message: GuestbookMessage;
  isMyMessage?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isMyMessage }) => {
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

  // 배경 색상 클래스 매핑
  const getBubbleStyle = () => {
    if (isMyMessage) {
      return 'bg-[#FEE500] text-[#191919] border border-yellow-400/60 rounded-2xl rounded-tr-xs';
    }
    switch (message.bubbleColor) {
      case 'pink':
        return 'bg-pink-50 text-stone-800 border border-pink-200/80 rounded-2xl rounded-tl-xs';
      case 'blue':
        return 'bg-sky-50 text-stone-800 border border-sky-200/80 rounded-2xl rounded-tl-xs';
      case 'green':
        return 'bg-emerald-50 text-stone-800 border border-emerald-200/80 rounded-2xl rounded-tl-xs';
      case 'purple':
        return 'bg-purple-50 text-stone-800 border border-purple-200/80 rounded-2xl rounded-tl-xs';
      case 'yellow':
        return 'bg-amber-50 text-stone-800 border border-amber-200/80 rounded-2xl rounded-tl-xs';
      case 'white':
      default:
        return 'bg-white text-stone-800 border border-stone-200/80 rounded-2xl rounded-tl-xs';
    }
  };

  return (
    <div className={`flex w-full my-2.5 group ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
      {/* 상대방 프로필 아바타 (좌측) */}
      {!isMyMessage && (
        <div className="flex-shrink-0 mr-2.5 mt-0.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-100/90 border border-amber-200/80 flex items-center justify-center text-lg shadow-xs select-none">
            {message.avatar || '💬'}
          </div>
        </div>
      )}

      {/* 메시지 및 정보 영역 */}
      <div className={`max-w-[78%] sm:max-w-[70%] flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
        {/* 상대방 닉네임 */}
        {!isMyMessage && (
          <div className="text-xs font-semibold text-stone-600 mb-1 ml-0.5 flex items-center space-x-1.5">
            <span>{message.nickname}</span>
          </div>
        )}

        <div className={`flex items-end space-x-1.5 ${isMyMessage ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
          {/* 말풍선 본체 */}
          <div
            className={`relative px-3.5 py-2.5 text-sm sm:text-base leading-relaxed break-words shadow-xs ${getBubbleStyle()}`}
          >
            <p className="whitespace-pre-wrap">{message.message}</p>
          </div>

          {/* 타임스탬프 & 반응 (말풍선 옆에 작게 카톡처럼 배치) */}
          <div className={`flex flex-col text-[11px] text-stone-600 pb-0.5 select-none ${isMyMessage ? 'items-end' : 'items-start'}`}>
            <span className="font-semibold text-stone-700 whitespace-nowrap">
              {formatRelativeTime(message.createdAt)}
            </span>
            <span className="text-[10px] text-stone-500 whitespace-nowrap">
              {formatClockTime(message.createdAt)}
            </span>

            {/* 공감/좋아요 버튼 */}
            <button
              onClick={handleLike}
              className={`mt-1 flex items-center space-x-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-transform active:scale-90 ${
                (message.likes || 0) > 0
                  ? 'bg-rose-50 text-rose-600 border border-rose-200/80'
                  : 'text-stone-500 hover:text-rose-500'
              } ${isLiking ? 'scale-125' : ''}`}
              title="좋아요 공감하기"
            >
              <Heart className={`w-3 h-3 ${(message.likes || 0) > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {(message.likes || 0) > 0 && <span>{message.likes}</span>}
            </button>
          </div>
        </div>

        {/* 호버 시 복사 버튼 (모바일 친화적 터치 가능) */}
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 ${isMyMessage ? 'mr-1' : 'ml-1'}`}>
          <button
            onClick={handleCopy}
            className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center space-x-1 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-stone-200 shadow-2xs"
          >
            {copied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
            <span>{copied ? '복사됨' : '복사'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
