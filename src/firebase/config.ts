/**
 * =========================================================================================
 * 📌 [Firebase 설정 파일 - src/firebase/config.ts]
 * 
 * 💡 파이어베이스(Firebase) v9+ 모듈러 SDK 초기화 설정
 * 
 * 👉 [설정 방법]
 * 1. Firebase 콘솔(https://console.firebase.google.com)에 구글 계정으로 로그인합니다.
 * 2. 무료 새 프로젝트를 생성합니다. (Google Analytics는 선택사항)
 * 3. 프로젝트 개요 페이지 중앙의 웹 아이콘(</>)을 클릭하여 웹 앱을 등록합니다.
 * 4. 발급된 firebaseConfig 객체 내용을 아래 `DEFAULT_FIREBASE_CONFIG` 안에 복사해 넣으세요!
 * 
 * ⚠️ 주의: Cloud Firestore 데이터베이스를 생성할 때 반드시 "테스트 모드(Test Mode)"로
 *    시작해야 별도의 복잡한 인증 로그인 없이도 누구나 방명록 글을 읽고 쓸 수 있습니다.
 * =========================================================================================
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import type { FirebaseConfigType } from '../types/guestbook';

/**
 * 🔑 [여기에 본인의 Firebase 콘솔 설정값을 붙여넣으세요!]
 * 
 * 예시:
 * const DEFAULT_FIREBASE_CONFIG: FirebaseConfigType = {
 *   apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxx",
 *   authDomain: "my-guestbook-app.firebaseapp.com",
 *   projectId: "my-guestbook-app",
 *   storageBucket: "my-guestbook-app.appspot.com",
 *   messagingSenderId: "123456789012",
 *   appId: "1:123456789012:web:abcdef123456",
 * };
 */
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigType = {
  // 1) apiKey: 브라우저에서 Firebase 서비스와 통신할 때 사용하는 공개 식별키
  apiKey: "",

  // 2) authDomain: Firebase 인증 서비스 도메인 (기본: 프로젝트ID.firebaseapp.com)
  authDomain: "",

  // 3) projectId: 내 Firebase 프로젝트 고유 ID (예: live-guestbook-777)
  projectId: "",

  // 4) storageBucket: 파일 저장을 위한 Cloud Storage 버킷 주소 (선택)
  storageBucket: "",

  // 5) messagingSenderId: 푸시 알림 발신자 고유 번호 (선택)
  messagingSenderId: "",

  // 6) appId: 본 웹 애플리케이션의 고유 식별자
  appId: "",
};

// 로컬 스토리지 키 (UI 상에서 설정을 변경하거나 테스트할 수 있게 지원)
export const STORAGE_KEY_FIREBASE_CONFIG = 'user_custom_firebase_config';

/**
 * 현재 활성화된 Firebase 설정값을 가져옵니다.
 * 1순위: 환경 변수 (Vercel 배포 시 Vercel Settings -> Environment Variables에 설정된 값)
 * 2순위: 브라우저 UI 설정 모달에서 직접 입력하여 저장한 값 (LocalStorage)
 * 3순위: 위 DEFAULT_FIREBASE_CONFIG에 직접 기입한 코드 값
 */
export function getActiveFirebaseConfig(): FirebaseConfigType {
  // 1순위: Vite / Vercel 환경 변수 (VITE_FIREBASE_*)
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const envAppId = import.meta.env.VITE_FIREBASE_APP_ID;

  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: envAppId || '',
    };
  }

  // 2순위: 로컬 스토리지에 저장된 설정
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('로컬 Firebase 설정을 읽는 중 오류:', err);
  }

  // 3순위: 기본 하드코딩 설정
  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * 올바른 Firebase 설정값이 입력되어 있는지 검증하는 함수
 */
export function isFirebaseConfigured(): boolean {
  const config = getActiveFirebaseConfig();
  return Boolean(
    config.apiKey &&
    config.apiKey.length > 5 &&
    config.projectId &&
    config.projectId.length > 2 &&
    config.appId &&
    config.appId.length > 5
  );
}

let firebaseAppInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

/**
 * Firebase App 및 Cloud Firestore 인스턴스를 안전하게 초기화합니다.
 */
export function getFirebaseServices(): { app: FirebaseApp | null; db: Firestore | null } {
  if (!isFirebaseConfigured()) {
    return { app: null, db: null };
  }

  try {
    const config = getActiveFirebaseConfig();
    const appName = '[DEFAULT]';
    
    // 이미 초기화된 앱이 있으면 재사용, 없으면 새로 초기화
    if (getApps().length > 0) {
      firebaseAppInstance = getApp(appName);
    } else {
      firebaseAppInstance = initializeApp(config, appName);
    }

    if (!firestoreInstance && firebaseAppInstance) {
      firestoreInstance = getFirestore(firebaseAppInstance);
    }

    return { app: firebaseAppInstance, db: firestoreInstance };
  } catch (error) {
    console.error('🔥 Firebase 초기화 중 오류 발생:', error);
    return { app: null, db: null };
  }
}

/**
 * Firestore DB 싱글톤 인스턴스 (필요 시 즉시 참조)
 */
export const { db } = getFirebaseServices();
