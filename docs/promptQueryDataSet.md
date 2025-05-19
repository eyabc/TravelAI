
# ✅ TravelAI 프롬프트 질문 데이터셋 통합 설계

---

## 📐 1. 프롬프트 질문 객체 구조

```json
{
  "id": "q01",
  "category": "여행 기본 정보",
  "question": {
    "ko": "누구와 함께 여행하시나요?",
    "en": "Who are you traveling with?"
  },
  "type": "single-choice",
  "options": [
    { "id": "solo", "label": { "ko": "혼자", "en": "Alone" } },
    { "id": "partner", "label": { "ko": "연인", "en": "Partner" } },
    { "id": "family", "label": { "ko": "가족", "en": "Family" }, "followUp": ["q10"] },
    { "id": "friends", "label": { "ko": "친구", "en": "Friends" } }
  ],
  "priority": 1,
  "systemImpact": {
    "travelMode": "adjust"
  },
  "reaction": {
    "family": {
      "ko": "좋아요! 가족 여행이라면 아이도 즐길 수 있는 장소를 준비할게요.",
      "en": "Great! We'll suggest family-friendly spots."
    }
  },
  "visibility": {
    "dependsOn": null
  }
}
```

---

## 📋 2. 새로운 필드 설명

| 필드                     | 역할                                 | 예시                                 |
| ---------------------- | ---------------------------------- | ---------------------------------- |
| `followUp`             | 특정 선택지에 대한 후속 질문 ID 지정             | `"family" → ["q10"]`               |
| `reaction`             | 선택 시 사용자에게 출력할 동적 메시지              | `"family" → 반응 메시지"`               |
| `visibility.dependsOn` | 특정 질문의 응답 조건에 따라 보일지 결정            | `"dependsOn": { "q01": "family" }` |
| `multilingual`         | 다국어 UI 완전 대응 (`ko`, `en`, `ja`, 등) | 각 필드에 `label.langCode` 존재          |
| `aiWeight`             | LLM 분석 가중치 부여 (향후 AI 학습에 반영)       | `aiWeight: 0.8`                    |

---

## 🔀 3. 조건 분기 예시

```json
{
  "id": "q10",
  "category": "동반자 정보 - 가족",
  "visibility": {
    "dependsOn": {
      "q01": "family"
    }
  },
  "question": {
    "ko": "아이의 나이를 알려주세요.",
    "en": "What is your child's age?"
  },
  "type": "single-choice",
  "options": [
    { "id": "under5", "label": { "ko": "5세 이하", "en": "Under 5" } },
    { "id": "6to12", "label": { "ko": "6세~12세", "en": "6–12 years" } },
    { "id": "teen", "label": { "ko": "청소년", "en": "Teen" } }
  ]
}
```

---

## 🧠 4. 시스템 반영 항목 예시 (큐레이션 영향)

```json
"systemImpact": {
  "filters": ["kidFriendly", "indoorIfRainy"],
  "scheduleType": "fixed",
  "travelPersona": "family"
}
```

* `filters`: 추천 명소/일정의 조건 필터
* `scheduleType`: 일정 생성 방식
* `persona`: 개인화 큐레이션 프로파일링 태그

---

## 📊 5. 전체 관리용 데이터셋 테이블 구조 (시트용)

| ID  | 질문 (ko)    | 유형   | 선택지 수 | 분기 대상             | 반응 메시지 | 영향도      | 다국어 수 |
| --- | ---------- | ---- | ----- | ----------------- | ------ | -------- | ----- |
| q01 | 누구와 함께...? | 단일선택 | 4     | q10 (family 선택 시) | 있음     | 일정 구조 조정 | 2     |
| q02 | 언제 떠나나요?   | 날짜   | -     | 없음                | 없음     | 날씨 기반 일정 | 2     |

---

## 🧠 6. LLM 연동 고려

* 프롬프트 구성 자동화용 `"aiIntent": "detectTravelStyle"` 필드 추가 가능
* 사용자의 선택 조합을 LLM prompt에 바로 삽입할 수 있도록 구성
* 질문 순서를 동적으로 변경하는 시스템 설계 가능

---

## 🧾 7. 저장 응답 예시 구조 (확장 대응 포함)

```json
{
  "sessionId": "uuid",
  "responses": [
    { "questionId": "q01", "answer": "family", "reactionShown": true },
    { "questionId": "q10", "answer": "6to12" },
    { "questionId": "q04", "answer": ["nature", "shopping"] }
  ]
}
```

---

## ✅ 지금부터 구현 대상에 포함된 주요 기능

* [x] 조건 분기형 질문 (`visibility.dependsOn`)
* [x] 선택지 기반 후속 질문 지정 (`followUp`)
* [x] 다국어 메시지 내장 (`question.ko/en`, `option.label.ko/en`)
* [x] 사용자 반응 메시지 출력 (`reaction`)
* [x] 시스템 영향도 반영 (`systemImpact`)
* [x] ML/LLM 연동 키 필드 (`aiIntent`, `aiWeight`)
* [x] 질문 UI 제어 정보 포함 (`priority`, `type` 등)

---
