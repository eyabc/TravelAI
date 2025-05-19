

# 🔄 번역 Fallback 정책

이 문서는 TravelAI 프로젝트의 다국어 번역 실패 또는 언어 미지원 상황에 대비한 Fallback 처리 방식을 정의합니다.

---

## 📌 적용 시점

다음 상황에서 Fallback 정책이 발동됩니다:

- 지정 언어로의 번역 실패 (외부 API 에러, GPT 응답 없음 등)
- 지정 언어가 시스템에서 지원되지 않는 경우
- 사용자의 기본 언어가 설정되어 있지 않음

---

## 🔁 Fallback 순서

1. 사용자 설정 언어 → `user.locale`
2. 브라우저 `Accept-Language` 또는 OS 언어
3. 시스템 기본 언어 (`default: en`)
4. 번역 실패 시 원문 반환 (`raw text`)

---

## 🚨 예외 상황 대응

| 상황 | 처리 방식 |
|------|-----------|
| 외부 번역 API 502 또는 timeout | 로그 기록 후 fallback 언어로 재시도 |
| 대상 언어 지원 안됨 | 기본 언어로 번역 시도 후, 실패 시 원문 유지 |
| 번역 결과 없음 또는 부적절 | `"Translation unavailable"` 기본 메시지 표시 |

---

## 🧪 테스트 항목

- 미지원 언어 코드 입력 시 fallback 작동 여부
- 외부 번역 API 비정상 응답 → fallback 처리 확인
- `Accept-Language`가 빈 경우 → `defaultLanguage` 적용 확인
- Fallback된 메시지에 대한 사용자 경고 메시지 노출 여부

---

## 💡 확장 고려

- fallback 경로 로그 수집 및 Kibana 필터링
- 사용자별 fallback 히스토리 기반 추천 언어 분석
- GPT 응답 실패 시 Deepl, Papago 등 다중 백엔드로 이중 fallback 구성