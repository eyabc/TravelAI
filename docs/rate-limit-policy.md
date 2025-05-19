

# 🚦 Rate Limit 정책 (요청 제한 정책)

TravelAI는 사용자, API 남용, 봇 트래픽 등을 방지하기 위해 세분화된 Rate Limit(요청 제한) 정책을 운영합니다. 아래는 각 서비스와 사용자 유형에 따른 제한 기준 및 대응 방안을 정리한 문서입니다.

---

## 🎯 정책 목적

- 과도한 요청으로 인한 서버 과부하 방지
- GPT API, 번역 API 등의 유료 자원 보호
- 악의적 공격 (예: brute force login, DoS 등) 차단
- 공정한 서비스 사용 환경 제공

---

## 🔐 사용자 등급에 따른 제한

사용자의 요금제 또는 구독 상태에 따라 다음과 같이 Rate Limit 기준을 차등 적용합니다. 유료 사용자의 편의성과 수익성 확보를 위해 높은 요청 한도를 제공합니다.

| 등급 | 제한 기준 | 설명 |
|------|------------|------|
| 비회원 / 비로그인 | 3 requests / minute | 비회원은 최소한의 탐색 기능만 제공 |
| Free 사용자 | 10 requests / hour | 무료 가입자는 기본적인 사용 가능 |
| Standard 유료 사용자 | 100 requests / day | 일반 유료 구독자 |
| Premium 유료 사용자 | 500 requests / day | 프리미엄 구독자 또는 제휴 고객 |
| 어드민 | 무제한 | 관리자 기능용 |
---

## 💬 주요 API별 제한

| API | 제한 기준 | 설명 |
|-----|------------|------|
| `/translate` | 20 req/min/user | 번역 API는 비용 발생 우려로 강화된 제한 적용 |
| `/curation` | 10 req/min/user | GPT 요청 포함으로 제한 강화 |
| `/auth/login` | 5 req/min/IP | brute force 방지를 위해 낮은 기준 적용 |
| `/curation/prompts/match` | 30 req/min/user | 프롬프트 매칭은 비교적 가벼운 작업 |

### 유료 등급에 따른 API별 제한 (예시)

| API | Free | Standard | Premium |
|-----|------|----------|---------|
| `/translate` | 10 req/min | 30 req/min | 100 req/min |
| `/curation` | 5 req/min | 20 req/min | 50 req/min |
| `/auth/login` | 공통: 5 req/min/IP |
| `/curation/prompts/match` | 30 req/min (공통) |

※ 단위: 요청 수 / 분 / 사용자
---

## 🌍 글로벌 / 지역 제한

- 특정 국가 또는 IP 대역에서 비정상 요청이 탐지될 경우, Cloudflare / WAF 기반 차단 정책 적용
- VPN, Proxy 우회 트래픽은 별도 로깅 및 제한

---

## 📦 기술적 구현

- Redis 기반 sliding window / fixed window 전략 병행 사용
- NestJS → `@nestjs/throttler`, Express 미들웨어 또는 Custom Decorator 활용
- 키 포맷: `ratelimit:{userId}:{route}` 또는 `ratelimit:ip:{ip}:{route}`

---

## 🚨 초과 시 응답 예시

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
  }
}
```

---

## 📊 모니터링 및 대응

- Prometheus 지표 예:
  - `ratelimit.exceeded.count`
  - `ratelimit.per_route.total`
- Grafana / Kibana에서 과다 사용자 탐지
- 반복 사용자에 대한 Slack 알림, IP 차단 자동화 가능

---

## 🔄 향후 확장 계획

- 사용자 등급별 Rate Limit 차등 적용 (예: 유료 사용자 완화)
- 어드민 패널에서 실시간 제한 조정 UI 제공
- GPT/번역 API 키 별 개별 제한 분리

---

✅ Rate Limit 정책은 시스템 안정성과 비용 최적화를 위한 중요한 요소입니다.