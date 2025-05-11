/**
 * 캐시 아이템 인터페이스
 */
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expires: number;
}

/**
 * 메모리 캐시 클래스
 */
export class MemoryCache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private defaultExpiry: number;
  private maxCacheSize: number;
  
  /**
   * 메모리 캐시 생성자
   * @param defaultExpiry 기본 만료 시간 (밀리초)
   * @param maxCacheSize 최대 캐시 항목 수 
   */
  constructor(defaultExpiry = 60 * 60 * 1000, maxCacheSize = 100) {
    this.defaultExpiry = defaultExpiry;
    this.maxCacheSize = maxCacheSize;
  }
  
  /**
   * 캐시에 데이터 설정
   * @param key 캐시 키
   * @param data 저장할 데이터
   * @param expiry 만료 시간 (기본값 사용 시 생략 가능)
   */
  set(key: string, data: T, expiry?: number): void {
    // 캐시 용량 초과 시 가장 오래된 항목 제거
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestItem();
    }
    
    const expires = expiry || Date.now() + this.defaultExpiry;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expires
    });
  }
  
  /**
   * 캐시에서 데이터 가져오기
   * @param key 캐시 키
   * @returns 캐시된 데이터 또는 undefined
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // 캐시 아이템이 없거나 만료된 경우
    if (!item || Date.now() > item.expires) {
      // 만료된 경우 캐시에서 제거
      if (item) {
        this.cache.delete(key);
      }
      return undefined;
    }
    
    return item.data;
  }
  
  /**
   * 캐시 항목 삭제
   * @param key 캐시 키
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * 모든 캐시 항목 삭제
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 만료된 캐시 항목 모두 제거
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * 가장 오래된 캐시 항목 제거
   */
  private evictOldestItem(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = item.timestamp;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
  /**
   * 캐시 크기 반환
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * 모든 캐시 키 가져오기
   */
  get keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// 기본 메모리 캐시 인스턴스 생성 (24시간 유효, 최대 500개 항목)
export const DEFAULT_CACHE = new MemoryCache(24 * 60 * 60 * 1000, 500);

/**
 * 캐시에서 데이터 가져오기, 없으면 생성 함수 실행 후 캐시
 * @param cache 캐시 인스턴스
 * @param key 캐시 키
 * @param createFn 데이터 생성 함수
 * @param options 캐시 옵션
 * @returns 데이터
 */
export async function getOrCreate<T>(
  cache: MemoryCache<T>,
  key: string,
  createFn: () => Promise<T>,
  options: { expiry?: number } = {}
): Promise<T> {
  // 캐시에서 데이터 찾기
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData;
  }
  
  // 캐시에 없으면 데이터 생성
  const data = await createFn();
  
  // 생성된 데이터 캐시에 저장
  cache.set(key, data, options.expiry);
  
  return data;
} 