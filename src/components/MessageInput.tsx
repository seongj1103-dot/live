import React, { useState, useEffect, useRef } from 'react';
import { Send, Dices, Smile, Palette, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { addGuestbookMessage } from '../firebase/guestbookService';
import { playSendSound } from '../utils/sound';

interface MessageInputProps {
  onMessageSent: (id: string) => void;
  soundEnabled: boolean;
}

const RANDOM_NICKNAMES = [
  '행복한 쿼카',
  '열정적인 라이언',
  '커피마시는 고양이',
  '코딩하는 펭귄',
  '산책하는 강아지',
  '달콤한 어피치',
  '춤추는 판다',
  '귀여운 춘식이',
  '새벽의 올빼미',
  '호기심많은 토끼'
];

const AVATAR_OPTIONS = ['🦁', '🐱', '🐶', '🐧', '🐰', '🐼', '🦊', '🐥', '🦄', '☕', '✨', '💻'];

const COLOR_OPTIONS: { id: string; name: string; bgClass: string }[] = [
  { id: 'yellow', name: '카톡 노랑', bgClass: 'bg-[#FEE500]' },
  { id: 'white', name: '클래식 화이트', bgClass: 'bg-white' },
  { id: 'pink', name: '파스텔 핑크', bgClass: 'bg-pink-300' },
  { id: 'blue', name: '스카이 블루', bgClass: 'bg-sky-300' },
  { id: 'green', name: '민트 그린', bgClass: 'bg-emerald-300' },
  { id: 'purple', name: '라벤더', bgClass: 'bg-purple-300' }
];

export const MessageInput: React.FC<MessageInputProps> = ({ onMessageSent, soundEnabled }) => {
  const [nickname, setNickname] = useState('');
  const [message, setMessage] = useState('');
  const [avatar, setAvatar] = useState('🦁');
  const [bubbleColor, setBubbleColor] = useState('yellow');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 저장된 닉네임 로드 또는 랜덤 생성
  useEffect(() => {
    const savedNick = localStorage.getItem('guestbook_user_nickname');
    const savedAvatar = localStorage.getItem('guestbook_user_avatar');
    if (savedNick) {
      setNickname(savedNick);
    } else {
      generateRandomNickname();
    }
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  }, []);

  const generateRandomNickname = () => {
    const random = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    setNickname(random);
    setAvatar(randomAvatar);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const finalNickname = nickname.trim() || '익명의 친구';
      localStorage.setItem('guestbook_user_nickname', finalNickname);
      localStorage.setItem('guestbook_user_avatar', avatar);

      const result = await addGuestbookMessage({
        nickname: finalNickname,
        message: message.trim(),
        avatar,
        bubbleColor
      });

      // 효과음 재생
      if (soundEnabled) {
        playSendSound();
      }

      // 기분 좋은 꽃가루 폭죽 효과!
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.85 },
        colors: ['#FEE500', '#FF6B6B', '#4D96FF', '#6BCB77']
      });

      setMessage('');
      onMessageSent(result.id);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err: any) {
      console.error('메시지 전송 실패:', err);
      setErrorMsg(err.message || '메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter는 전송, Shift + Enter는 줄바꿈
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // 자동 높이 조절
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="bg-[#f0e9e9]/95 backdrop-blur-md border-t border-stone-300 p-3 sm:p-4 shadow-lg">
      <div className="max-w-2xl mx-auto">
        {/* 상단 닉네임 & 프로필 아바타 선택 바 */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-1.5 flex-1 max-w-xs">
            {/* 이모지 아바타 버튼 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowColorPicker(false);
                }}
                className="w-8 h-8 rounded-xl bg-white border border-stone-300 flex items-center justify-center text-lg hover:border-yellow-400 shadow-2xs transition-colors"
                title="프로필 이모지 변경"
              >
                {avatar}
              </button>

              {/* 이모지 선택 팝오버 */}
              {showEmojiPicker && (
                <div className="absolute bottom-10 left-0 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 z-40 grid grid-cols-4 gap-1 w-44">
                  {AVATAR_OPTIONS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => {
                        setAvatar(em);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1.5 hover:bg-stone-100 rounded-lg text-lg text-center transition-transform hover:scale-110"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 닉네임 입력란 */}
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="작성자 닉네임"
              maxLength={20}
              className="w-full bg-white border border-stone-300 rounded-xl px-2.5 py-1 text-xs sm:text-sm font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:border-yellow-500 shadow-2xs"
            />

            {/* 랜덤 닉네임 주사위 버튼 */}
            <button
              type="button"
              onClick={generateRandomNickname}
              className="p-1.5 bg-white border border-stone-300 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-50 shadow-2xs transition-colors flex-shrink-0"
              title="랜덤 닉네임 추천받기"
            >
              <Dices className="w-4 h-4 text-stone-600" />
            </button>
          </div>

          {/* 말풍선 색상 선택 토글 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowEmojiPicker(false);
              }}
              className="flex items-center space-x-1 text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-300 px-2 py-1 rounded-xl shadow-2xs transition-colors"
            >
              <Palette className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">말풍선 색</span>
              <span className={`w-3 h-3 rounded-full border border-stone-300 ${COLOR_OPTIONS.find(c => c.id === bubbleColor)?.bgClass}`} />
            </button>

            {/* 컬러 선택 팝오버 */}
            {showColorPicker && (
              <div className="absolute bottom-10 right-0 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 z-40 flex space-x-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setBubbleColor(c.id);
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full border-2 ${c.bgClass} transition-transform hover:scale-115 ${
                      bubbleColor === c.id ? 'ring-2 ring-stone-800 ring-offset-1' : 'border-stone-300'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 메시지 본문 입력창 및 전송 버튼 */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="방명록 한마디를 남겨보세요! (Enter로 전송, Shift+Enter로 줄바꿈)"
              rows={2}
              maxLength={300}
              className="w-full bg-white border border-stone-300 rounded-2xl px-3.5 py-2.5 text-sm sm:text-base text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:border-yellow-500 shadow-2xs resize-none leading-relaxed"
            />
            <div className="absolute right-3 bottom-2 text-[10px] text-stone-600 pointer-events-none select-none">
              {message.length}/300
            </div>
          </div>

          <button
            type="submit"
            disabled={!message.trim() || isSubmitting}
            className={`h-11 px-4 sm:px-5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center space-x-1.5 transition-all shadow-sm flex-shrink-0 ${
              message.trim() && !isSubmitting
                ? 'bg-[#FEE500] text-[#191919] hover:bg-[#ebd300] active:scale-95 cursor-pointer font-extrabold'
                : 'bg-stone-200 text-stone-600 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="inline-block animate-spin w-4 h-4 border-2 border-stone-600 border-t-transparent rounded-full" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">메시지 남기기</span>
                <span className="sm:hidden">남기기</span>
              </>
            )}
          </button>
        </form>

        {errorMsg && (
          <p className="mt-1.5 text-xs text-rose-600 font-medium px-1">
            ⚠️ {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
};
