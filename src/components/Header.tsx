import React from 'react';
import { MessageSquare, Flame, Volume2, VolumeX, LayoutGrid, MessageCircle, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { isFirebaseConfigured } from '../firebase/config';

interface HeaderProps {
  viewMode: 'chat' | 'feed';
  setViewMode: (mode: 'chat' | 'feed') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  openGuide: () => void;
  messageCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  soundEnabled,
  setSoundEnabled,
  openGuide,
  messageCount
}) => {
  const isConfigured = isFirebaseConfigured();

  return (
    <header className="sticky top-0 z-30 bg-[#3a1d1d] text-white shadow-md border-b border-[#2d1616]">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* 로고 & 타이틀 */}
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FEE500] flex items-center justify-center text-[#191919] shadow-inner font-black text-xl flex-shrink-0">
            톡
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight text-yellow-300">
                실시간 한마디 방명록
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-[#2a1414] text-yellow-200 border border-yellow-500/30">
                {messageCount}개
              </span>
            </div>
            {/* 상태 인디케이터 */}
            <div className="flex items-center space-x-1.5 mt-0.5 text-xs text-stone-300">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-[11px] sm:text-xs">
                {isConfigured ? (
                  <span className="text-emerald-300 font-medium">🔥 Firestore onSnapshot 연결됨</span>
                ) : (
                  <span className="text-amber-300 font-medium">실시간 데모 모드 (멀티탭 동기화)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 우측 도구 버튼들 */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* 뷰 모드 전환 (카톡 말풍선 vs 카드 피드) */}
          <div className="bg-[#2a1414] p-0.5 rounded-xl border border-stone-700/50 flex">
            <button
              onClick={() => setViewMode('chat')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 ${
                viewMode === 'chat'
                  ? 'bg-[#FEE500] text-[#191919] shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
              title="카카오톡 말풍선 뷰"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('feed')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 ${
                viewMode === 'feed'
                  ? 'bg-[#FEE500] text-[#191919] shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
              title="카드 피드 뷰"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* 소리 효과 토글 */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-[#2a1414] border-stone-700 text-yellow-300 hover:bg-[#351a1a]'
                : 'bg-[#2a1414] border-stone-700/50 text-stone-500 hover:text-stone-300'
            }`}
            title={soundEnabled ? '효과음 켜짐' : '효과음 꺼짐'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Firebase 설정 및 안내 버튼 */}
          <button
            onClick={openGuide}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 ${
              isConfigured
                ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-400/40'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white animate-pulse'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Firebase 설정</span>
            <span className="sm:hidden">설정</span>
          </button>
        </div>
      </div>
    </header>
  );
};
