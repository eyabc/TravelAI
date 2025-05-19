# 🌐 TravelAI i18n 구조 및 전략

본 문서는 TravelAI 프로젝트에서 사용하는 다국어(i18n) 시스템의 구조, 파일 구성, 유지 전략을 설명합니다.

---

## 📁 리소스 파일 구조

모든 번역 리소스는 JSON 파일로 구성되며, 언어별 디렉토리에 위치합니다:

```
src/
  i18n/
    translations/
      en/
        common.json
      ko/
        common.json
      ja/
        common.json
```

---

## 📦 파일 구성 예시: `common.json`

```json
{
  "app.title": "TravelAI - Your Smart Travel Companion",
  "menu.home": "Home",
  "menu.profile": "My Profile",
  "button.start": "Start",
  "error.network": "Network error. Please try again."
}
```

> Key는 도트(.) 표기법으로 네임스페이스를 구분합니다

---

## 🧠 키 네이밍 규칙

- 접두어로 카테고리 구분 (`menu.`, `button.`, `error.`, `guide.` 등)
- 대문자 사용 금지, 일관된 소문자 표기
- 위치 기반 키 사용 지양 (ex: `page1.title` ❌)

---

## 🏗️ NestJS 연동 방식

`nestjs-i18n` 패키지를 사용하며, 다음과 같은 방식으로 번역을 호출합니다:

```ts
@Get()
getWelcome(@I18n() i18n: I18nContext) {
  return i18n.t('app.title');
}
```

---

## 🔄 런타임 언어 감지 우선순위

1. 사용자가 선택한 언어 (`user-preference`)
2. 브라우저 `Accept-Language` 헤더
3. 기본 언어: `en`

---

## 🛠️ 유지 및 확장 전략

- Crowdin, Lokalise 등 협업 기반 번역 플랫폼 연동 고려
- 새 기능 추가 시 `common.json` → `feature-<name>.json` 분리 가능
- 사용률 낮은 키는 분기별로 제거하거나 deprecated 처리

---

## 🧪 테스트 전략

- key 누락 시 fallback 동작 테스트
- 번역 파일 로딩 실패 시 기본값 처리
- `i18n.t()` 호출 결과 mock 테스트 지원

---

## 🧩 확장 고려

- region 지원: `zh-CN`, `zh-TW` 등 fallback 체계화
- 번역 버전 관리 및 캐싱
- 사용자 선호 번역 표현 반영 (personalized i18n)

