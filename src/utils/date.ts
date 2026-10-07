/**
 * Firestore 타임스탬프 또는 날짜 객체를 받아 "방금 전", "3분 전", "오후 3:15" 등으로 변환하는 유틸리티
 */
export function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return '방금 전';

  let date: Date;

  // Firestore Timestamp 객체 ({ seconds, nanoseconds } or toDate())
  if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (typeof timestamp.seconds === 'number') {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return '방금 전';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 10) {
    return '방금 전';
  }
  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`;
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  // 날짜가 오래된 경우 YYYY.MM.DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * 카카오톡 스타일 시각 표시 (예: "오후 2:34")
 */
export function formatClockTime(timestamp: any): string {
  if (!timestamp) return '';

  let date: Date;
  if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (typeof timestamp.seconds === 'number') {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date();
  }

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 || 12;

  return `${ampm} ${displayHours}:${minutes}`;
}
