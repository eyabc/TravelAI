

# 📊 Translation 시스템 메트릭 설계

이 문서는 TravelAI 프로젝트의 번역 시스템 성능 및 안정성을 모니터링하기 위한 Prometheus 기반 메트릭 설계 전략을 정리합니다.

---

## 🎯 메트릭 수집 목적

- 번역 요청 처리량 및 지연 시간 분석
- 캐시 적중률, 실패율 추적
- 번역 서비스 성능 병목 및 장애 조기 탐지

---

## 📈 주요 메트릭 항목

### 1. 번역 요청 수

```ts
translation_requests_total{from="ko", to="en"}
```

- 언어쌍별 요청 수
- 전체 번역 트래픽 분석

### 2. 번역 처리 시간 (ms)

```ts
translation_latency_ms{provider="gpt"}
```

- 백엔드 번역 처리 속도 측정
- 평균/최댓값 기준 SLA 설정

### 3. 캐시 적중률

```ts
translation_cache_hit_total
translation_cache_miss_total
```

- `hit / (hit + miss)` 로 계산
- 캐시 전략 적정성 평가 지표

### 4. 실패 카운트

```ts
translation_failure_total{reason="timeout"}
```

- 외부 API 에러, timeout, 인증 실패 등 원인별 분류
- 경고 알림 기준 설정 가능

### 5. fallback 사용률

```ts
translation_fallback_total{fallback="defaultLang"}
```

- fallback 정책이 얼마나 자주 작동하는지 추적

---

## 📦 Export 방식

- NestJS: `@willsoto/nestjs-prometheus` 모듈 사용
- 메트릭 endpoint: `/metrics`
- Grafana 또는 PromLens와 연동 가능

---

## 📌 알림 예시 (AlertManager)

```yaml
- alert: TranslationHighErrorRate
  expr: rate(translation_failure_total[5m]) > 0.1
  for: 1m
  labels:
    severity: warning
  annotations:
    summary: "High Translation Failure Rate"
    description: "More than 10% of translation requests are failing"
```

---

## 🔍 참고 사항

- latency는 histogram 또는 summary로 export 추천
- fallback 로그와 메트릭을 일치시켜 문제 원인 분석 강화
- 카나리 릴리즈 등과 연계해 A/B 성능 실험 가능