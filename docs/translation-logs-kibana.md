

# 📈 Translation 로그 설계 및 Kibana 연동 전략

이 문서는 TravelAI 번역 시스템에서 발생하는 주요 로그 항목을 정의하고, Kibana를 통해 이를 시각화하고 분석하는 방법을 설명합니다.

---

## 📦 로그 항목 정의

| 필드명 | 설명 |
|--------|------|
| `timestamp` | 로그 발생 시각 |
| `level` | 로그 수준 (`INFO`, `WARN`, `ERROR`) |
| `event` | 이벤트 타입 (`translate.request`, `translate.cache.hit`, `translate.error`, ...) |
| `textHash` | 번역 대상 텍스트의 SHA-256 해시 |
| `from` / `to` | 번역 언어 쌍 |
| `cached` | 캐시 사용 여부 |
| `provider` | 사용된 번역 엔진 (예: `gpt`, `deepl`) |
| `latencyMs` | 응답 지연(ms) |
| `status` | 번역 처리 결과 (`success`, `fail`, `fallback`) |
| `userId` | (옵션) 사용자 식별자 |
| `errorMessage` | (옵션) 오류 발생 시 상세 메시지 |

---

## 🧰 로그 출력 포맷 예시 (JSON)

```json
{
  "timestamp": "2025-05-17T13:45:12Z",
  "level": "INFO",
  "event": "translate.cache.hit",
  "textHash": "fb3acb9f...",
  "from": "ko",
  "to": "en",
  "cached": true,
  "provider": "gpt",
  "latencyMs": 42,
  "status": "success",
  "userId": "u-92844"
}
```

---

## 🔍 Kibana 시각화 전략

- 번역 호출량 추이: `event:translate.request` count over time
- 평균 응답 시간: `avg(latencyMs)` by `provider`
- 캐시 적중률: `cached:true` vs `false` 비율
- 실패 이벤트 필터링: `event:translate.error` AND `status:fail`
- 언어쌍별 번역 요청 분포: `from` / `to` 필드별 aggregation

---

## 📊 메트릭 연동 (선택)

Kibana 외에도 Prometheus로 지표 수집 시 다음 항목이 대응됨:

- `translation_latency_ms`
- `translation_cache_hit_total`
- `translation_failure_total`

---

## 📌 참고

- NestJS에서 `winston` + `nestjs-pino` 등으로 로그 출력 가능
- JSON 포맷 통일성 확보로 Kibana index template 관리 용이
- 오류 코드별 분석을 위해 `errorMessage` field 유지 권장