

# 🏗️ Architecture Overview (TravelAI 시스템 아키텍처 개요)

이 문서는 TravelAI의 전반적인 시스템 아키텍처를 요약하고, 주요 구성 요소와 흐름을 설명합니다.

---

## 🧱 아키텍처 구성

TravelAI는 다음과 같은 계층 구조로 구성됩니다:

```
Client (iOS/Android/Web)
    ↓
API Gateway (NestJS)
    ↓
Application Layer
    ├── Auth Module
    ├── User Module
    ├── Translation Module
    ├── Curation Module
    ├── Prompt Module
    └── Admin Module
    ↓
Infrastructure Layer
    ├── Redis (캐시, 세션)
    ├── PostgreSQL (사용자, 설정 저장)
    ├── Local File Server (리소스, 번역 파일)
    └── GPT/Translation API (외부 API 연동)
```

---

## 🔄 주요 흐름

### 1. 사용자 로그인 및 로케일 등록

- 클라이언트가 로그인 요청을 보냄
- JWT Access/Refresh Token 발급
- 사용자 로케일은 DB 및 Redis에 저장됨
- 이후 모든 요청은 서버에서 로케일을 조회하여 번역/큐레이션에 활용

### 2. 여행 큐레이션 요청

- 사용자 입력 → 영어로 번역
- 영어 입력으로 프롬프트 규칙 매칭
- GPT 응답 → 사용자 언어로 재번역
- 결과 반환

### 3. 번역 캐싱 처리

- Redis에 캐시가 있는 경우 바로 응답
- 없으면 GPT 또는 Translation API 요청 후 저장

---

## 🌍 다국어 및 번역 전략

- 입력은 모두 영어 기준으로 통합 매칭
- 출력은 사용자 로케일 기준으로 자동 변환
- Glossary, Fallback, 캐시, 메트릭 연동 포함

---

## 🧠 프롬프트 규칙 시스템

- YAML 기반 규칙 파일 로딩
- 언어별로 조건부 매칭 가능
- 관리자 커스터마이징을 위한 구조 설계됨

---

## 🔒 보안 및 인증

- NestJS + JWT 기반 인증
- Refresh Token Redis 보관
- Rate Limit 정책 (요금제별 제한)
- API 키 보호 및 OAuth 연동

---

## 📊 운영 및 모니터링

- Prometheus, Grafana, Kibana, Sentry 연동
- 캐시 hit/miss, GPT latency, 번역 성공률 등 지표 수집
- Slack 알림 및 장애 대응 정책 포함

---

## 🧩 확장성 및 마이크로서비스화

- prompt / curation / translation 모듈은 MSA 분리 가능
- OpenAPI / Swagger 명세 기반 통신
- 언어별 번역, 정책 파일은 S3 또는 DB로 중앙 관리 가능

---

✅ 이 문서는 TravelAI 시스템의 초기 구조 기준으로 작성되었으며, 모듈화 및 실 서비스 적용에 따라 업데이트되어야 합니다.