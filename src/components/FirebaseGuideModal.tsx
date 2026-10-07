import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Flame, ShieldAlert, Sparkles, Database, Code, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getActiveFirebaseConfig, STORAGE_KEY_FIREBASE_CONFIG, isFirebaseConfigured } from '../firebase/config';
import { testFirestoreConnection } from '../firebase/guestbookService';

interface FirebaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const FirebaseGuideModal: React.FC<FirebaseGuideModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'directInput' | 'rules'>('guide');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // 직접 입력 테스트용 상태
  const [inputConfigStr, setInputConfigStr] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const currentConfig = getActiveFirebaseConfig();
  const configured = isFirebaseConfigured();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSaveAndTestConfig = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      let parsed: any = null;

      // 텍스트가 const firebaseConfig = { ... }; 형식인 경우 파싱 처리
      let cleanStr = inputConfigStr.trim();
      if (cleanStr.includes('{') && cleanStr.includes('}')) {
        const start = cleanStr.indexOf('{');
        const end = cleanStr.lastIndexOf('}');
        let jsonLike = cleanStr.substring(start, end + 1);

        // 키값에 따옴표가 없을 경우를 대비한 정규식 치환
        jsonLike = jsonLike
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/'/g, '"')
          .replace(/,\s*}/g, '}');

        parsed = JSON.parse(jsonLike);
      }

      if (!parsed || !parsed.apiKey || !parsed.projectId) {
        throw new Error('올바른 firebaseConfig 형식이 아닙니다. apiKey와 projectId를 확인해주세요.');
      }

      // 로컬 스토리지에 저장
      localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(parsed));
      
      // 연결 테스트 수행
      const pingRes = await testFirestoreConnection();
      setTestResult(pingRes);

      if (pingRes.success) {
        setTimeout(() => {
          onConfigSaved();
        }, 1000);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || '설정값을 파싱할 수 없습니다. 형식을 확인해주세요.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetToDefault = () => {
    localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
    setInputConfigStr('');
    setTestResult(null);
    onConfigSaved();
  };

  const sampleConfigSnippet = `// src/firebase/config.ts 파일 내 DEFAULT_FIREBASE_CONFIG에 아래처럼 대입합니다:
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigType = {
  apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};`;

  const sampleRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /guestbook/{messageId} {
      // 누구나 읽기 허용 (실시간 방명록)
      allow read: if true;
      // 유효한 메시지 규격 검사 후 작성 허용
      allow create: if request.resource.data.nickname is string &&
                       request.resource.data.message is string &&
                       request.resource.data.createdAt == request.time;
      // 좋아요 카운트 증가 허용
      allow update: if request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likes']);
    }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* 모달 헤더 */}
        <div className="bg-[#3a1d1d] text-white px-5 py-4 flex items-center justify-between border-b border-[#2a1414]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400">
              <Flame className="w-5 h-5 fill-orange-400" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white">
                파이어베이스(Firebase) 연동 가이드
              </h2>
              <p className="text-xs text-stone-300">
                무료 Firestore 생성부터 실시간 onSnapshot 방명록 연동까지
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'guide'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>단계별 설정 안내</span>
          </button>
          <button
            onClick={() => setActiveTab('directInput')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'directInput'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>설정 즉시 적용 & 테스트</span>
            {configured && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'rules'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>보안 규칙(Rules) 복사</span>
          </button>
        </div>

        {/* 모달 본문 (스크롤 영역) */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm text-stone-700 leading-relaxed">
          {/* TAB 1: 단계별 설정 안내 */}
          {activeTab === 'guide' && (
            <div className="space-y-5">
              {/* STEP 1 */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="font-bold text-stone-900 text-base">
                      Firebase 콘솔 접속 및 무료 프로젝트 생성
                    </h3>
                  </div>
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs"
                  >
                    <span>콘솔 바로가기</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-stone-600">
                  구글 계정으로 로그인 후 <b>[프로젝트 추가]</b>를 클릭합니다. 프로젝트 이름(예: <code>my-live-guestbook</code>)을 적고 계속을 눌러 프로젝트를 생성합니다. (Google 애널리틱스는 비활성화해도 무방합니다)
                </p>
              </div>

              {/* STEP 2 */}
              <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="font-bold text-stone-900 text-base">
                    Firestore 데이터베이스 생성 & '테스트 모드' 시작
                  </h3>
                </div>
                <div className="space-y-2 text-xs text-stone-600">
                  <p>
                    1. 좌측 메뉴 <b>빌드(Build) ➔ Firestore Database</b> 클릭 후 <b>[데이터베이스 만들기]</b>를 선택합니다.
                  </p>
                  <p>
                    2. 위치(Region)는 <b>asia-northeast3 (서울)</b> 또는 기본값을 선택합니다.
                  </p>
                  <div className="p-3 bg-white rounded-xl border border-sky-200 text-stone-800">
                    <div className="flex items-center space-x-1.5 font-bold text-sky-800 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>중요: 보안 규칙 선택 단계에서 "테스트 모드로 시작"을 고르세요!</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-normal">
                      테스트 모드로 시작하면 향후 30일간 별도의 로그인 인증 절차 없이도 누구나 방명록 글을 읽고 쓸 수 있는 규칙이 자동 적용됩니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* STEP 3 */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-bold text-stone-900 text-base">
                    웹 앱 등록( &lt;/&gt; ) 및 firebaseConfig 복사
                  </h3>
                </div>
                <p className="text-xs text-stone-600 mb-2">
                  프로젝트 개요 화면 중앙의 <b>웹(&lt;/&gt;) 아이콘</b>을 눌러 앱 닉네임을 적고 등록합니다. 화면에 표시되는 <code>const firebaseConfig = &#123; ... &#125;;</code> 내용을 복사합니다.
                </p>
              </div>

              {/* STEP 4 */}
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                      4
                    </span>
                    <h3 className="font-bold text-stone-900 text-base">
                      내 코드 어디에 넣어야 할까요?
                    </h3>
                  </div>
                  <button
                    onClick={() => handleCopy(sampleConfigSnippet, 'configCode')}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center space-x-1 bg-white px-2 py-1 rounded-lg border border-purple-200 shadow-2xs"
                  >
                    {copiedKey === 'configCode' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'configCode' ? '복사됨!' : '예시 복사'}</span>
                  </button>
                </div>
                <p className="text-xs text-stone-600 mb-2">
                  프로젝트 내 <code className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded font-mono font-bold">src/firebase/config.ts</code> 파일의 <code>DEFAULT_FIREBASE_CONFIG</code> 부분에 붙여넣으시거나, <b>Vercel 배포 시에는 Vercel Settings &gt; Environment Variables에 <code>VITE_FIREBASE_API_KEY</code> 등으로 등록</b>하시면 GitHub에 키를 공개하지 않고도 안전하게 연동됩니다:
                </p>
                <pre className="bg-[#24292e] text-stone-200 p-3 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
                  {sampleConfigSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: 설정 즉시 적용 & 테스트 */}
          {activeTab === 'directInput' && (
            <div className="space-y-4">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-bold text-sm text-stone-900">
                    현재 연결 상태
                  </h3>
                  {configured ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Firebase 연결 설정됨</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>미연동 (실시간 데모 모드 작동 중)</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500">
                  프로젝트 ID: <code className="font-mono font-bold text-stone-700">{currentConfig.projectId || '(설정 없음)'}</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Firebase 콘솔에서 복사한 firebaseConfig 붙여넣기:
                </label>
                <textarea
                  value={inputConfigStr}
                  onChange={(e) => setInputConfigStr(e.target.value)}
                  placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "...",\n  projectId: "...",\n  storageBucket: "...",\n  messagingSenderId: "...",\n  appId: "..."\n};`}
                  rows={8}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500 leading-relaxed"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start space-x-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>{testResult.message}</div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-xs text-stone-500 hover:text-stone-800 underline"
                >
                  기본값/데모 모드로 초기화
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndTestConfig}
                  disabled={!inputConfigStr.trim() || isTesting}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center space-x-1.5 shadow-sm ${
                    inputConfigStr.trim() && !isTesting
                      ? 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
                      : 'bg-stone-300 cursor-not-allowed'
                  }`}
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>설정 저장 및 연결 테스트</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: 보안 규칙 */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-stone-900">
                    추천 Firestore 보안 규칙 (firestore.rules)
                  </h3>
                  <p className="text-xs text-stone-500">
                    30일 테스트 모드가 끝난 후에도 안전하게 방명록을 운영할 수 있는 프로덕션 규칙입니다.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(sampleRulesSnippet, 'rulesCode')}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200"
                >
                  {copiedKey === 'rulesCode' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'rulesCode' ? '복사됨!' : '규칙 복사'}</span>
                </button>
              </div>

              <pre className="bg-[#24292e] text-stone-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                {sampleRulesSnippet}
              </pre>
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
          <div className="text-xs text-stone-500">
            💡 브라우저 창 2개를 나란히 띄워두고 실시간 동기화를 테스트해보세요!
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
