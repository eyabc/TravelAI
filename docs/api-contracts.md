# 📄 API 계약 명세서 (API Contracts)

본 문서는 TravelAI의 프론트엔드와 백엔드 간 통신을 위한 API 계약을 정의합니다. 각 API의 입력/출력 형식, 응답 구조, 에러 처리 방식 등을 명확히 하여 안정적인 개발 및 통합을 지원합니다.

---

## ✅ 공통 사항

- 응답 형식: `application/json`
- 인증: 대부분의 API는 JWT 기반 Bearer 토큰 필요
- 타임존: 모든 시간은 UTC ISO 8601 형식 사용
- 에러 응답 형식:
  ```json
  {
    "error": {
      "code": "INVALID_PARAMETER",
      "message": "쿼리 파라미터 'lang'는 필수입니다."
    }
  }
  ```
- 언어 처리: 사용자의 언어 정보는 로그인 세션 시 Redis 등에 저장되며, API 요청 시 별도로 전송하지 않음

---

## 🔐 인증 API

### POST /auth/login
- 설명: 이메일 기반 로그인 처리
- 요청 Body:
  ```json
  {
    "email": "user@example.com",
    "password": "********"
  }
  ```
- 응답:
  ```json
  {
    "access_token": "JWT_ACCESS_TOKEN",
    "refresh_token": "JWT_REFRESH_TOKEN",
    "user": {
      "id": "abc123",
      "email": "user@example.com",
      "name": "홍길동"
    }
  }
  ```

---

## 🌍 번역 API

### POST /translate
- 설명: 다국어 텍스트 번역 처리
- 요청 Body:
  ```json
  {
    "text": "I'm traveling alone.",
    "sourceLang": "en",
    "targetLang": "ko"
  }
  ```
- 응답:
  ```json
  {
    "translatedText": "혼자 여행 중이에요."
  }
  ```

---

## ✈️ 여행 큐레이션 API

### POST /curation
- 설명: 사용자 입력 기반 AI 여행 추천 응답
- 요청 Body:
  ```json
  {
    "input": "I’m traveling alone."
  }
  ```
- 언어 정보는 별도로 전송하지 않으며, 서버는 Redis에 저장된 사용자 세션 기반 로케일 정보를 활용하여 응답을 처리합니다.
- 응답:
  ```json
  {
    "suggestions": [
      {
        "title": "조용한 자연 휴양지",
        "description": "혼자서도 안전하고 편안한 자연 여행지를 추천합니다.",
        "location": "제주도 비자림"
      },
      ...
    ],
    "sourcePrompt": "The user is traveling solo. Recommend safe and quiet places..."
  }
  ```

---

## 🧠 프롬프트 규칙 매칭 API

### GET /curation/prompts/match
- 설명: 영어 입력과 규칙 매칭된 GPT 프롬프트 반환
- 쿼리 파라미터:
  - `input`: 번역된 영어 입력
- 응답:
  ```json
  {
    "matchedPrompt": "The user is traveling solo. Recommend safe and quiet places..."
  }
  ```

---

## 🧰 번역 캐시 조회 API

### GET /translate/cache
- 설명: 번역 캐시 결과 조회
- 쿼리 파라미터:
  - `text`: 원본 텍스트
  - `sourceLang`: 원본 언어
  - `targetLang`: 대상 언어
- 응답:
  ```json
  {
    "translatedText": "혼자 여행 중이에요.",
    "cacheHit": true
  }
  ```

---

## 📝 기타

- 전체 OpenAPI 스펙은 `/docs/api.yml` 참고
- Swagger UI는 `/api-docs` 경로에 제공됨 (개발 환경에서만 노출)