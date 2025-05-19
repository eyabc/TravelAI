
# 🔧 TranslationCacheService 설계 및 구현 (NestJS 기반)

이 문서는 TravelAI의 번역 캐시 처리 로직을 담당하는 서비스 모듈에 대한 설계 및 구현 예제를 제공합니다.

---

## 🎯 목표

- Redis 기반 번역 캐시 저장 및 조회
- TTL 기반 자동 만료 처리
- Lua Script 통합을 통한 원자적 캐싱

---

## 📁 파일 구조

```
src/
  translation/
    translation-cache.service.ts
    dto/
      translate-request.dto.ts
      translate-response.dto.ts
```

---

## 🔐 Key 설계 규칙

```
translate:{from}:{to}:{SHA-256(text)}
```

- 예시: `translate:ko:en:fb3acb...`

---

## 🧱 서비스 인터페이스 정의

```ts
export interface TranslationCacheService {
  getCachedTranslation(key: string): Promise<string | null>;
  setCachedTranslation(key: string, value: string, ttl: number): Promise<void>;
  getOrSetTranslation(key: string, ttl: number, fallback: () => Promise<string>): Promise<string>;
}
```

---

## 🛠 구현 예시 (NestJS, ioredis 사용)

```ts
@Injectable()
export class RedisTranslationCacheService implements TranslationCacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async getCachedTranslation(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async setCachedTranslation(key: string, value: string, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, value);
  }

  async getOrSetTranslation(
    key: string,
    ttl: number,
    fallback: () => Promise<string>
  ): Promise<string> {
    const luaScript = fs.readFileSync('translate_cache.lua', 'utf8');
    const result = await this.redis.eval(luaScript, 1, key, ttl, await fallback());
    return result as string;
  }
}
```

---

## 📌 기타 고려사항

- JSON.stringify로 직렬화된 객체 캐싱 권장
- 캐시 미스 시 LLM 또는 외부 번역 API 호출
- `?noCache=true` 요청 시 캐시 우회

---

## 🧪 테스트 포인트

- Redis에 저장된 key/TTL 확인
- 동일 요청 반복 시 캐시 hit 여부
- TTL 경과 후 재요청 시 API 재호출 여부

---

## 🔄 확장 계획

- 사용자 개인화 캐시 키(`uid:` 접두어)
- 결과 사이즈 압축 저장 (e.g. GZIP)
- 복수 언어 fallback 키 지원 (e.g. `translate:ko:zh-Hant` → fallback `zh`)