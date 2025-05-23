# 🌐 언어 지원 전략

이 문서는 TravelAI의 언어 지원 전략을 설명하며, 지원하는 로케일, 폴백 로직, 번역 관리 및 다국어 환경에서의 시스템 동작 방식을 포함합니다.

---

## 🗣️ 지원 언어

TravelAI는 UI와 GPT 기반 상호작용 모두에서 전세계 모든 언어를 지원합니다.

---

## 🌍 로케일 감지 및 처리

| 출처 | 방법 |
|--------|--------|
| 클라이언트 기기 | `navigator.language` 또는 `Accept-Language` 헤더 |
| 사용자 프로필 (선택 사항) | 계정 설정에 저장된 사용자 선호 언어 |
| URL 매개변수 (선택 사항) | `?lang=ko`가 모든 설정을 덮어씀 |

제공된 정보가 없으면 기본 로케일은 **영어 (`en`)**입니다.

---

## 🧠 GPT 다국어 프롬프트 로직

TravelAI는 다음과 같은 다국어 번역 워크플로우를 사용합니다:

1. 사용자 입력(어떤 언어든)을 먼저 **영어**로 번역
2. 영어로 된 GPT 프롬프트를 적용하여 응답 생성
3. 최종 응답을 사용자의 원래 언어로 다시 번역

이 방식은 입력 언어에 관계없이 프롬프트 규칙과 엄선된 결과가 항상 영어로 일관되게 처리되도록 보장합니다.

자세한 내용은 `curation-i18n-strategy.md`를 참고하세요.

---

## 📁 번역 리소스 파일

모든 UI 텍스트와 시스템 문자열은 한글 기반으로 작성된 데이터를 
배포 할 때 마다, AI 가 번역하여 각 나라별 로케일별 JSON 기반 리소스 파일을 생성하며 관리됩니다:

```
locales/
  en.json
  ko.json
  ja.json
  ...
```

각 키는 점(dot) 표기법을 사용한 평면 구조를 따릅니다. 예:

```json
{
  "home.title": "Welcome to TravelAI",
  "curation.start": "Start your travel plan",
  "curation.loading": "Finding the best destinations..."
}
```

번역 파일은 Crowdin 또는 Git 기반 워크플로우로 관리됩니다.

---

## 🔄 폴백 동작

현재 로케일에 번역 키가 없을 경우 폴백 절차:

1. 영어(`en`)에서 키 확인
2. 마지막 수단으로 원시 키 문자열 표시 (예: `"home.title"`)

GPT 폴백 정책 (`translation-fallback-policy.md` 참고):
- 출력물을 사용자의 언어로 번역할 수 없으면 영어로 반환
- UI에서 영어 버전이 표시됨을 사용자에게 알림

---

## 📊 모니터링 및 지표

번역 시스템은 다음과 같은 지표를 제공합니다:

- `i18n.missing_key.count`
- `i18n.translation.latency`
- `i18n.auto_fallback.count`

이 지표들은 Prometheus를 통해 내보내지고 Grafana로 모니터링됩니다.

---

## 🛠️ 개발자 가이드라인

- 모든 UI 컴포넌트에서 `t('key')` 또는 `translate('key')`를 사용하세요
- 표시 문자열을 하드코딩하지 마세요
- 동적 문자열은 상황에 맞는 키로 감싸세요

---

## 🔮 향후 개선 사항

- 관리자 UI에서 문맥 기반 번역 편집 기능
- 런타임 중 동적 언어 전환
- 사용자가 맞춤 설정할 수 있는 문구 용어집
- 현지화된 데이터셋을 활용한 GPT 미세 조정

---

## ✅ 요약

TravelAI의 다국어 지원은 일관성, 확장성 및 품질을 목표로 설계되었습니다. 영어로 중앙 집중화된 프롬프트 처리와 견고한 폴백 정책은 다양한 언어에서 고품질 사용자 경험을 보장합니다.