export interface GuestbookMessage {
  id: string;
  nickname: string;
  message: string;
  createdAt: any; // Firestore Timestamp or number (Date.now())
  avatar?: string;
  bubbleColor?: string;
  likes?: number;
  isMyMessage?: boolean;
}

export interface FirebaseConfigType {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}
