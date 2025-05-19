

# 🗃 TravelAI 번역 캐시 설계

번역 캐시는 다음의 목적을 가지고 설계됩니다:

- 💨 **속도 향상**: 동일 문장 번역 재요청 시 즉시 응답
- 💸 **비용 절감**: 외부 API 호출 (GPT, DeepL 등) 최소화
- 🧠 **문맥 일관성 유지**: 사용자 질문 흐름에 따라 번역 내용 일치

---

## 1. 🔑 캐시 키 설계

**Key 구조** (Redis 기준):

```
translate:{from}:{to}:{hash(text)}
```

예시:

```
translate:ja:en:fb3acb28f8...
```

> `text`는 원문이 길 수 있으므로 해시(SHA-256 or MD5)로 처리

---

## 2. 📦 캐시 저장값

```json
{
  "translatedText": "I would like to visit a temple in Kyoto.",
  "provider": "deepl",
  "createdAt": "2025-05-17T14:23:50Z"
}
```

---

## 3. ⏳ TTL (만료 시간)

| 타입 | TTL |
|------|-----|
| 일반 텍스트 번역 | 7일 |
| 명소 설명, 시스템 메시지 등 빈번한 요청 | 30일 |
| 긴급/일시적 메시지 | 1일 |

> Redis에서는 `EXPIRE` 명령으로 자동 관리

---

## 4. ⚙️ 캐시 처리 흐름

```text
1. 캐시 조회 (Redis GET)
2. 존재하지 않으면 외부 번역 API 호출
3. 번역 결과 Redis SET (TTL 포함)
4. 결과 반환
```

---

## 5. 📌 Redis 키 스페이스 예시

| Key 예시 | 설명 |
|----------|------|
| `translate:ko:en:abc123` | 한국어 → 영어 번역 |
| `translate:en:fr:xyz789` | 영어 → 프랑스어 번역 |
| `translate:ko:ja:temp777` | 한국어 → 일본어 번역 |

---

## 6. 📉 예외 처리

- ❌ 금지어 포함, 실패한 번역 결과는 `null` 캐싱 (TTL 1시간)
- 🧪 테스트 환경에서는 캐시 우회 옵션 지원 (`?noCache=true`)

---

## 7. ✅ 캐시 적용 대상

| 대상 | 캐시 여부 |
|------|------------|
| 프롬프트 질문 다국어 변환 | ✅ |
| 명소 설명 요약 번역 | ✅ |
| 유저 프리텍스트 응답 | ⛔ (문맥이 달라질 수 있음) |
| 긴급 알림 번역 | ✅ (단, TTL 짧게) |

---

## 8. 🔧 확장 고려

- 사용자 선호 표현을 반영한 **개인화 번역 캐시**
- **Locale fallback 캐시** (예: `zh-Hant` → `zh`)
- Cloudflare Workers 등 엣지 캐시 계층 구성

---

## 🔜 다음 작업 제안

- [ ] Redis Lua Script 기반 캐시 저장/조회 예제 작성
- [ ] Prometheus 지표 설계 (`cache_hit`, `cache_miss`, `ttl_expired` 등)
- [ ] NestJS 기반 번역 캐시 서비스 구현