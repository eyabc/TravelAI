# 📘 /translate API 상세 명세서

다국어 번역을 위한 `/translate` 엔드포인트의 상세 명세입니다.

---

## ✅ 기본 정보

- Method: GET
- Endpoint: `/translate`
- 설명: 입력된 텍스트를 AI 번역 엔진을 사용하여 지정된 언어로 번역합니다.

---

## 🔗 요청 파라미터

| 이름 | 필수 | 타입 | 설명 |
|------|------|------|------|
| `text` | ✅ | string | 번역할 원문 텍스트 |
| `from` | ❌ | string | 원본 언어 코드 (`auto` 가능) |
| `to` | ✅ | string | 대상 언어 코드 |
| `noCache` | ❌ | boolean | true일 경우 캐시 무시 후 새로 번역 |

---

## 🧾 응답 예시 (200)

```json
{
  "translatedText": "I want to visit a temple in Kyoto.",
  "provider": "gpt",
  "cached": true
}
```

---

## ❌ 오류 코드

| 상태 코드 | 설명 |
|------------|------|
| 400 Bad Request | 필수 파라미터 누락 또는 잘못된 언어 코드 |
| 502 Bad Gateway | 외부 번역 API 오류 |
| 429 Too Many Requests | 호출 제한 초과 (rate-limit) |

---

## 📌 기타 사항

- `from=auto`를 사용하면 서버가 자동으로 원본 언어를 감지합니다.
- `noCache=true`를 사용하면 항상 새로 번역을 시도합니다.
- 응답에는 사용된 번역 제공자(`gpt`, `deepl` 등)와 캐시 여부가 포함됩니다.