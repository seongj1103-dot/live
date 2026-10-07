/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import type { GuestbookMessage } from './types/guestbook';
import { subscribeGuestbookMessages, addGuestbookMessage } from './firebase/guestbookService';
import { isFirebaseConfigured, getActiveFirebaseConfig } from './firebase/config';
import { Header } from './components/Header';
import { ChatBubble } from './components/ChatBubble';
import { FeedCard } from './components/FeedCard';
import { MessageInput } from './components/MessageInput';
import { FirebaseGuideModal } from './components/FirebaseGuideModal';
import { playReceiveSound } from './utils/sound';
import { Flame, Sparkles, Search, ArrowDown, Bot, Users, Info } from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [viewMode, setViewMode] = useState<'chat' | 'feed'>('chat');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [myMessageIds, setMyMessageIds] = useState<Set<string>>(new Set());
  const [hasNewMessageBelow, setHasNewMessageBelow] = useState(false);
  const [timeTick, setTimeTick] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<number>(0);

  // 로컬에 기록된 나의 작성 메시지 ID 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem('guestbook_my_message_ids');
      if (saved) {
        setMyMessageIds(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // 상대적 시간 표시("방금 전", "1분 전")를 위해 30초마다 틱 갱신
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Firebase 실시간 리스너(onSnapshot) 구독
  useEffect(() => {
    const unsubscribe = subscribeGuestbookMessages(
      (newMessages) => {
        setMessages(newMessages);

        // 이전보다 메시지 수가 늘어났을 때 (새 글 도착)
        if (
          previousMessageCountRef.current > 0 &&
          newMessages.length > previousMessageCountRef.current
        ) {
          const lastMsg = newMessages[newMessages.length - 1];
          const isMine = lastMsg && myMessageIds.has(lastMsg.id);

          // 내가 쓴 글이 아닌 다른 사람이 쓴 글일 때 효과음 재생
          if (!isMine && soundEnabled) {
            playReceiveSound();
          }

          // 스크롤이 맨 아래가 아니면 "새 메시지 도착" 알림 플로팅
          if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
            if (!isNearBottom) {
              setHasNewMessageBelow(true);
            } else {
              scrollToBottom('smooth');
            }
          }
        } else if (previousMessageCountRef.current === 0) {
          // 최초 로드 시 스크롤 맨 아래로 이동
          setTimeout(() => scrollToBottom('auto'), 100);
        }

        previousMessageCountRef.current = newMessages.length;
      },
      (error) => {
        console.error('실시간 방명록 구독 오류:', error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [soundEnabled, myMessageIds]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setHasNewMessageBelow(false);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      setHasNewMessageBelow(false);
    }
  };

  const handleMessageSent = (id: string) => {
    setMyMessageIds((prev) => {
      const next = new Set(prev).add(id);
      localStorage.setItem('guestbook_my_message_ids', JSON.stringify(Array.from(next)));
      return next;
    });
    setTimeout(() => scrollToBottom('smooth'), 100);
  };

  // 실시간 봇 시뮬레이션 (새로고침 없이 글이 실시간으로 쏙 나타나는 효과를 즉시 체감)
  const handleSimulateIncomingMessage = async () => {
    const BOT_NICKNAMES = ['지나가던 여행자 🎒', '커피매니아 ☕', '야근요정 🧚‍♂️', '호기심많은 춘식이 🐱'];
    const BOT_MESSAGES = [
      '우와! 새로고침(F5) 안 눌렀는데 지금 이 글이 쏙 실시간으로 나타났죠? 대박이에요!',
      'Firebase onSnapshot 덕분에 실시간 통신이 매끄럽네요! 🚀',
      '카카오톡 스타일 말풍선이라서 모바일에서도 쓰기 너무 편해요 ㅎㅎ',
      '오늘도 다들 즐거운 코딩 하세요! 힘내자구요 파이팅 💪'
    ];
    const BOT_AVATARS = ['🎒', '☕', '🧚‍♂️', '🐱'];
    const BOT_COLORS = ['white', 'pink', 'blue', 'green'];

    const idx = Math.floor(Math.random() * BOT_MESSAGES.length);

    await addGuestbookMessage({
      nickname: BOT_NICKNAMES[idx],
      message: BOT_MESSAGES[idx],
      avatar: BOT_AVATARS[idx],
      bubbleColor: BOT_COLORS[idx]
    });
  };

  const isConfigured = isFirebaseConfigured();
  const currentConfig = getActiveFirebaseConfig();

  // 검색 필터링
  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.nickname.toLowerCase().includes(q) || m.message.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-screen w-full bg-[#b2c7d9] text-stone-900 overflow-hidden font-sans">
      {/* 1. 상단 글로벌 헤더 */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        openGuide={() => setIsGuideOpen(true)}
        messageCount={messages.length}
      />

      {/* 2. 상태 알림 배너 */}
      <div className="bg-[#a0b8cc] px-4 py-1.5 border-b border-[#8ea9bf] text-xs flex items-center justify-between text-[#2e4052] shadow-2xs">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            {isConfigured ? (
              <>
                <Flame className="w-3.5 h-3.5 text-orange-600 flex-shrink-0" />
                <span className="font-semibold text-emerald-950">
                  Firebase Firestore 연결: {currentConfig.projectId}
                </span>
                <span className="text-[11px] text-emerald-900 hidden sm:inline">
                  (실시간 onSnapshot 활성)
                </span>
              </>
            ) : (
              <>
                <Info className="w-3.5 h-3.5 text-amber-800 flex-shrink-0" />
                <span className="font-semibold text-amber-950">
                  실시간 데모 모드 (멀티 탭 실시간 동기화 지원)
                </span>
                <span className="text-[11px] text-amber-900 hidden sm:inline">
                  — 내 Firebase 연동은 우측 버튼 클릭
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* 가상 실시간 글 시뮬레이션 버튼 */}
            <button
              onClick={handleSimulateIncomingMessage}
              className="text-[11px] font-bold text-[#1e2f40] hover:text-black bg-white/60 hover:bg-white/90 px-2 py-0.5 rounded-md border border-[#85a0b7] transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
              title="새로고침 없이 실시간으로 글이 들어오는 모습을 즉시 테스트합니다"
            >
              <Bot className="w-3 h-3 text-orange-600" />
              <span>실시간 글 도착 시뮬레이션</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 검색 바 (메시지가 많을 때 유용) */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-2 pb-1">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="닉네임 또는 방명록 내용 검색..."
            className="w-full pl-8 pr-3 py-1.5 bg-white/70 backdrop-blur-xs hover:bg-white/90 focus:bg-white border border-stone-300 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FEE500] shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-600 hover:text-stone-900"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 4. 메인 방명록 스크롤 컨테이너 */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-2 relative"
      >
        <div className="max-w-2xl mx-auto pb-4">
          {/* 채팅방 상단 시작 배너 */}
          <div className="text-center my-3 select-none">
            <span className="inline-flex items-center space-x-1 bg-black/15 text-stone-800 text-[11px] px-3 py-1 rounded-full font-medium backdrop-blur-2xs">
              <Users className="w-3 h-3 text-stone-700" />
              <span>새로고침(F5) 없이 실시간 동기화되는 방명록입니다</span>
            </span>
          </div>

          {/* 메시지 목록 렌더링 */}
          {filteredMessages.length === 0 ? (
            <div className="my-16 text-center text-stone-600 bg-white/50 backdrop-blur-xs rounded-3xl p-8 border border-white/60 shadow-xs max-w-sm mx-auto">
              <p className="text-4xl mb-3">💌</p>
              <h3 className="font-bold text-base text-stone-800 mb-1">
                {searchQuery ? '검색 결과가 없습니다' : '첫 번째 방명록을 남겨보세요!'}
              </h3>
              <p className="text-xs text-stone-500">
                {searchQuery
                  ? '다른 검색어로 다시 시도해보세요.'
                  : '하단 입력창에 닉네임과 따뜻한 한마디를 적고 [메시지 남기기]를 눌러보세요.'}
              </p>
            </div>
          ) : viewMode === 'chat' ? (
            /* 카카오톡 말풍선 모드 */
            <div className="flex flex-col">
              {filteredMessages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isMyMessage={myMessageIds.has(msg.id)}
                />
              ))}
            </div>
          ) : (
            /* 카드 피드 모드 */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
              {filteredMessages.map((msg) => (
                <FeedCard
                  key={msg.id}
                  message={msg}
                  isMyMessage={myMessageIds.has(msg.id)}
                />
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 새 메시지 도착 플로팅 버튼 */}
        {hasNewMessageBelow && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 bg-stone-900/90 hover:bg-stone-900 text-[#FEE500] px-4 py-2 rounded-full text-xs font-bold shadow-xl border border-stone-700 flex items-center space-x-1.5 transition-all animate-bounce"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>새 글이 도착했습니다!</span>
          </button>
        )}
      </main>

      {/* 5. 하단 메시지 입력 폼 */}
      <MessageInput
        onMessageSent={handleMessageSent}
        soundEnabled={soundEnabled}
      />

      {/* 6. 파이어베이스 연동 가이드 모달 */}
      <FirebaseGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onConfigSaved={() => {
          setIsGuideOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
