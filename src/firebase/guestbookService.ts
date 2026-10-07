/**
 * =========================================================================================
 * 📌 [방명록 서비스 모듈 - src/firebase/guestbookService.ts]
 * 
 * 💡 Firebase v9+ Firestore의 실시간 리스너(onSnapshot) 및 데이터 쓰기(addDoc) 로직
 * 
 * - collection: 'guestbook' 컬렉션 참조
 * - query & orderBy: 작성일시(createdAt) 기준 정렬
 * - onSnapshot: 새로고침(F5) 없이도 데이터 변경 시 즉각 콜백 실행
 * - serverTimestamp: 클라이언트 시계 조작 방지 및 신뢰할 수 있는 서버 시각 기록
 * =========================================================================================
 */

import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  getDocFromServer,
  Unsubscribe,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { getFirebaseServices, isFirebaseConfigured } from './config';
import type { GuestbookMessage } from '../types/guestbook';

const COLLECTION_NAME = 'guestbook';

// 데모/시뮬레이션용 로컬 스토리지 키 (Firebase 미설정 시에도 실시간 방명록 체험 제공)
const DEMO_STORAGE_KEY = 'demo_guestbook_messages';

const INITIAL_DEMO_MESSAGES: GuestbookMessage[] = [
  {
    id: 'demo-1',
    nickname: '파이어베이스 요정 ✨',
    message: '환영합니다! Firebase Firestore onSnapshot을 통해 실시간으로 동기화되는 방명록입니다. 다른 브라우저 탭을 열어서 테스트해보세요!',
    createdAt: Date.now() - 1000 * 60 * 12,
    avatar: '🧚',
    bubbleColor: 'yellow',
    likes: 5
  },
  {
    id: 'demo-2',
    nickname: '라이언 🦁',
    message: '새로고침(F5)을 누르지 않아도 글이 뿅 하고 나타나요! 디자인이 카카오톡 같아서 정겹네요 ㅎㅎ',
    createdAt: Date.now() - 1000 * 60 * 5,
    avatar: '🦁',
    bubbleColor: 'white',
    likes: 3
  },
  {
    id: 'demo-3',
    nickname: '코딩하는 펭귄 🐧',
    message: '상단 [🔥 파이어베이스 설정 가이드]를 누르면 내 무료 Firebase 프로젝트와 연동하는 법을 바로 확인할 수 있어요!',
    createdAt: Date.now() - 1000 * 45,
    avatar: '🐧',
    bubbleColor: 'white',
    likes: 8
  }
];

function getStoredDemoMessages(): GuestbookMessage[] {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return INITIAL_DEMO_MESSAGES;
}

function saveStoredDemoMessages(messages: GuestbookMessage[]) {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    // ignore
  }
}

/**
 * 1. 실시간 방명록 리스너 등록 (onSnapshot)
 * Firestore 컬렉션에 새 글이 추가/수정/삭제되면 자동으로 callback이 발동합니다.
 */
export function subscribeGuestbookMessages(
  onMessagesUpdate: (messages: GuestbookMessage[]) => void,
  onError?: (error: Error) => void
): () => void {
  const { db } = getFirebaseServices();

  // A. Firebase가 연동되어 있는 경우: 실제 Firestore onSnapshot 연결
  if (isFirebaseConfigured() && db) {
    try {
      const guestbookRef = collection(db, COLLECTION_NAME);
      // 최신 50개 메시지를 작성일시 오름차순(채팅처럼 오래된 것 -> 최신 순)으로 조회
      const q = query(guestbookRef, orderBy('createdAt', 'asc'), limit(100));

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const messages: GuestbookMessage[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            messages.push({
              id: docSnap.id,
              nickname: data.nickname || '익명',
              message: data.message || '',
              createdAt: data.createdAt,
              avatar: data.avatar || '💬',
              bubbleColor: data.bubbleColor || 'white',
              likes: data.likes || 0
            });
          });
          onMessagesUpdate(messages);
        },
        (error) => {
          console.error('🔥 Firestore onSnapshot 실시간 동기화 오류:', error);
          if (onError) onError(error);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error('🔥 Firestore 리스너 등록 실패:', err);
      if (onError && err instanceof Error) onError(err);
    }
  }

  // B. Firebase 미설정 상태인 경우: 로컬 스토리지 기반 멀티 탭 실시간 동기화 (Storage Event)
  const loadAndEmitDemo = () => {
    const current = getStoredDemoMessages();
    onMessagesUpdate(current);
  };

  loadAndEmitDemo();

  // 다른 브라우저 탭/창과의 실시간 동기화 리스너
  const storageListener = (event: StorageEvent) => {
    if (event.key === DEMO_STORAGE_KEY) {
      loadAndEmitDemo();
    }
  };

  // 커스텀 로컬 이벤트 리스너 (동일 탭 내 즉각 갱신)
  const localUpdateListener = () => {
    loadAndEmitDemo();
  };

  window.addEventListener('storage', storageListener);
  window.addEventListener('demo_guestbook_update', localUpdateListener);

  return () => {
    window.removeEventListener('storage', storageListener);
    window.removeEventListener('demo_guestbook_update', localUpdateListener);
  };
}

/**
 * 2. 방명록 새 메시지 작성 (addDoc)
 */
export async function addGuestbookMessage(params: {
  nickname: string;
  message: string;
  avatar?: string;
  bubbleColor?: string;
}): Promise<{ id: string }> {
  const { db } = getFirebaseServices();

  const trimmedNickname = params.nickname.trim() || '익명의 친구';
  const trimmedMessage = params.message.trim();

  if (!trimmedMessage) {
    throw new Error('메시지 내용을 입력해주세요.');
  }

  // A. 실제 Firestore 연동 시
  if (isFirebaseConfigured() && db) {
    const guestbookRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(guestbookRef, {
      nickname: trimmedNickname,
      message: trimmedMessage,
      avatar: params.avatar || '😊',
      bubbleColor: params.bubbleColor || 'white',
      likes: 0,
      createdAt: serverTimestamp() // Firestore 서버 시간 사용
    });
    return { id: docRef.id };
  }

  // B. 데모 모드일 때 (로컬 스토리지 반영 및 다른 탭 동기화 트리거)
  const current = getStoredDemoMessages();
  const newMsg: GuestbookMessage = {
    id: 'demo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    nickname: trimmedNickname,
    message: trimmedMessage,
    avatar: params.avatar || '😊',
    bubbleColor: params.bubbleColor || 'white',
    likes: 0,
    createdAt: Date.now()
  };

  const updated = [...current, newMsg];
  saveStoredDemoMessages(updated);

  // 동일 탭 및 다른 탭에 브로드캐스트
  window.dispatchEvent(new CustomEvent('demo_guestbook_update'));

  return { id: newMsg.id };
}

/**
 * 3. 메시지 좋아요/공감 토글 (updateDoc & increment)
 */
export async function likeGuestbookMessage(messageId: string): Promise<void> {
  const { db } = getFirebaseServices();

  if (isFirebaseConfigured() && db) {
    const docRef = doc(db, COLLECTION_NAME, messageId);
    await updateDoc(docRef, {
      likes: increment(1)
    });
    return;
  }

  // 데모 모드
  const current = getStoredDemoMessages();
  const updated = current.map((m) => (m.id === messageId ? { ...m, likes: (m.likes || 0) + 1 } : m));
  saveStoredDemoMessages(updated);
  window.dispatchEvent(new CustomEvent('demo_guestbook_update'));
}

/**
 * 4. Firestore 연결 테스트 (테스트 모드 규칙 검증용)
 */
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  const { db } = getFirebaseServices();
  if (!isFirebaseConfigured() || !db) {
    return {
      success: false,
      message: 'Firebase 설정이 입력되지 않았습니다. config.ts에 firebaseConfig를 넣어주세요.'
    };
  }

  try {
    // 핑 테스트용 가상 문서 확인 시도
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    return {
      success: true,
      message: '✅ Firebase Firestore에 성공적으로 연결되었습니다!'
    };
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (msg.includes('offline') || msg.includes('Failed to get document')) {
      return {
        success: false,
        message: '클라이언트가 오프라인이거나 Firebase 네트워크 연결이 원활하지 않습니다.'
      };
    }
    if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      return {
        success: false,
        message: '보안 규칙 오류: Firestore를 "테스트 모드(Test Mode)"로 설정했는지 확인해주세요. (30일 읽기/쓰기 허용)'
      };
    }
    return {
      success: false,
      message: `연결 확인 중 오류 발생: ${msg}`
    };
  }
}
