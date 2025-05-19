

# 🧩 TranslationService 구현 설계 (NestJS 기반)

TravelAI의 번역 기능은 다국어 입력을 받아 캐시 및 번역 API를 통합 처리하는 서비스 계층을 통해 구현됩니다.

---

## 🎯 책임 분리

- Controller: 요청 유효성 검증 및 언어 파라미터 수신
- Service: 캐시 조회 → 번역 API 호출 → 캐시 저장 → 응답 가공
- Provider: GPT 등 실제 번역 처리 로직 담당
- CacheService: Redis 캐시 인터페이스 추상화

---

## 📦 주요 클래스 구성

```
translation/
  controller/
    translation.controller.ts
  service/
    translation.service.ts
  provider/
    gpt-translate.provider.ts
  cache/
    translation-cache.service.ts
```

---

## 🔄 TranslationService 인터페이스

```ts
export interface TranslationService {
  translateText(text: string, from: string, to: string, noCache?: boolean): Promise<TranslatedResult>;
}
```

---

## 🔧 구현 예시

```ts
@Injectable()
export class TranslationServiceImpl implements TranslationService {
  constructor(
    private readonly cache: TranslationCacheService,
    private readonly provider: TranslationProvider
  ) {}

  async translateText(text: string, from: string, to: string, noCache = false): Promise<TranslatedResult> {
    const key = this.getCacheKey(text, from, to);

    if (!noCache) {
      const cached = await this.cache.getCachedTranslation(key);
      if (cached) return JSON.parse(cached);
    }

    const translated = await this.provider.translate(text, from, to);
    await this.cache.setCachedTranslation(key, JSON.stringify(translated), 60 * 60 * 24 * 7); // 7일 TTL

    return translated;
  }

  private getCacheKey(text: string, from: string, to: string): string {
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    return `translate:${from}:${to}:${hash}`;
  }
}
```

---

## 🧪 테스트 전략

- 캐시 hit/miss 여부 테스트
- noCache=true 시 강제 재번역 검증
- provider 에러 발생 시 fallback 처리 확인

---

## 📌 확장 고려사항

- 사용자 ID 기반 캐시 키 확장
- 번역 요청 로깅 (event: `translate.request`)
- 추후 다중 provider (`gpt`, `deepl`, `papago`) 선택 구조로 확장 가능