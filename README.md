# 💌 실시간 한마디 방명록 (Live Guestbook)

Firebase Firestore의 실시간 리스너(`onSnapshot`)를 활용하여 새로고침(F5) 없이도 다른 사용자의 글이 즉시 나타나는 카카오톡 스타일 방명록 웹 애플리케이션입니다.

---

## 🚀 GitHub 업로드 및 Vercel 배포 가이드

### 1단계: GitHub 저장소(Repository)에 업로드
1. GitHub(github.com)에서 새 Repository를 생성합니다 (예: `live-guestbook`).
2. 프로젝트 폴더 터미널에서 아래 명령어로 깃허브에 코드를 푸시합니다:
   ```bash
   git init
   git add .
   git commit -m "feat: 실시간 방명록 프로젝트 초기 커밋"
   git branch -M main
   git remote add origin https://github.com/내계정/내저장소.git
   git push -u origin main
   ```
   *(💡 `.gitignore`에 이미 `.env` 및 `node_modules`가 포함되어 있으므로 안전합니다)*

---

### 2단계: Vercel 배포하기
1. **[Vercel](https://vercel.com)**에 로그인 (GitHub 계정으로 로그인 추천).
2. **[Add New...]** ➔ **[Project]** 클릭.
3. 방금 푸시한 GitHub 저장소(`live-guestbook`)를 선택하고 **[Import]** 클릭.
4. **Project Settings**:
   - **Framework Preset**: `Vite` (자동 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `vite build` (기본값)
   - **Output Directory**: `dist` (기본값)
5. **Environment Variables (환경 변수 설정)**:
   > ⚠️ **중요**: Firebase 설정을 환경 변수로 등록하면 GitHub에 API 키를 노출하지 않고 안전하게 배포할 수 있습니다.
   
   Vercel 화면의 **Environment Variables**에 아래 6가지 키를 등록합니다:

   | Key 이름 | 값 예시 |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | `AIzaSyD-xxxxxxxxxxxxxxxxxxxx` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `내프로젝트.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | `내프로젝트-id` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `내프로젝트.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` |
   | `VITE_FIREBASE_APP_ID` | `1:123456789012:web:abcdef` |

6. **[Deploy]** 버튼을 클릭하면 약 1분 내에 배포가 완료되고 나만의 URL이 생성됩니다!

---

## 🔥 Firebase Firestore 설정 (테스트 모드)
1. [Firebase 콘솔](https://console.firebase.google.com) 접속 ➔ 무료 프로젝트 생성
2. **Firestore Database** 생성 ➔ 보안 규칙에서 **"테스트 모드로 시작(Test mode)"** 선택 (30일간 읽기/쓰기 허용)
3. **웹 앱( `</>` )** 등록 후 발급된 키를 위 Vercel 환경 변수에 입력하거나 웹 앱 내 **[Firebase 설정]** 모달에서 바로 입력하여 사용할 수 있습니다.
