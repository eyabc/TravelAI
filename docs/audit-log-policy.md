

# 📜 감사 로그 정책 (Audit Log Policy)

이 문서는 TravelAI 시스템 내의 중요 활동에 대한 감사 로그(Audit Log) 기록 및 활용 방식을 정의합니다.

---

## 🎯 목적

- 중요 시스템 행위에 대한 이력 기록
- 내부 보안 및 사고 분석 근거 확보
- GDPR, ISO 27001 등 보안 인증 대응

---

## 🔐 감사 로그 대상 행위

| 카테고리 | 행위 예시 |
|----------|-----------|
| 사용자 | 회원 가입, 탈퇴, 설정 변경 |
| 인증 | 로그인, 로그아웃, 토큰 재발급 |
| 관리자 | 프롬프트 규칙 수정, 기능 ON/OFF 변경 |
| 번역 | glossary 등록, fallback 설정 변경 |
| 시스템 | 캐시 초기화, 기능 플래그 변경, 서비스 재시작 |

---

## 📝 로그 항목 구조 예시

```json
{
  "timestamp": "2025-05-20T10:15:00Z",
  "actor": {
    "id": "admin_001",
    "role": "admin"
  },
  "action": "PROMPT_RULE_UPDATED",
  "target": {
    "type": "prompt_rule",
    "id": "kr-travel-basic"
  },
  "metadata": {
    "before": { "lang": "ko", "ruleCount": 3 },
    "after": { "lang": "ko", "ruleCount": 4 }
  },
  "ip": "192.168.0.1",
  "userAgent": "Chrome/123.0"
}
```

---

## 💾 저장 방식 및 보존 기간

- 저장소: PostgreSQL 또는 MongoDB
- 보존 기간: 기본 180일, GDPR 대응 시 30일 삭제 옵션 제공
- 별도 아카이빙: 1년치 이상 장기 저장 시 별도 백업

---

## 🛠️ 활용 방안

- 관리자 대시보드 내 감사 로그 조회 기능
- 이상 징후 알림: 프롬프트 다중 삭제 등 행위 시 Slack 알림
- 사용자 요청 시 이력 제공 (개인정보 범위 내)

---

## 📊 모니터링 및 지표화

- 주간 감사 로그 생성량
- 관리자 행위 중 가장 많은 액션
- 가장 많이 수정된 prompt rule ID

Grafana 또는 Kibana 기반 시각화 가능

---

## 🛡️ 보안 및 무결성

- 로그 위/변조 방지 위한 append-only 방식 권장
- 로그 암호화 저장 및 접근권한 제한
- AWS KMS 또는 Vault 기반의 key 관리 (선택적)

---

## 🔮 향후 확장 고려

- JSON schema 기반 감사로그 자동 검증
- AI 기반 이상 행위 탐지 연결 (ex: 관리자 의심 반복행동)
- 로그 압축/전송을 위한 Kafka 연동