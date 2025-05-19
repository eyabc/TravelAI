# 🧩 공통 타입 정의 (shared-types.md)

이 문서는 TravelAI 전역에서 사용되는 공통 TypeScript 타입 및 인터페이스 정의를 문서화합니다. 프론트엔드와 백엔드 간 일관성 있는 데이터 구조 공유를 위한 참조용입니다.

---

## 🧍 사용자 관련 타입

```ts
export interface User {
  id: string;
  email: string;
  name: string;
  locale: string;
  role: 'user' | 'admin';
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}
```

---

## 🌍 번역 관련 타입

```ts
export interface TranslateRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export interface TranslateResponse {
  translatedText: string;
  sourceLang?: string;
  targetLang?: string;
  cacheHit?: boolean;
}
```

---

## ✈️ 큐레이션 관련 타입

```ts
export interface CurationRequest {
  input: string;
}

export interface CurationSuggestion {
  title: string;
  description: string;
  location?: string;
}

export interface CurationResponse {
  suggestions: CurationSuggestion[];
  sourcePrompt?: string;
}
```

---

## 🧠 프롬프트 매칭 타입

```ts
export interface PromptMatchResponse {
  matchedPrompt: string;
  ruleId?: string;
}
```

---

## ❌ 에러 타입

```ts
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
```

---

## 📦 기타 타입

```ts
export type Locale =
  | 'af' | 'am' | 'ar' | 'az' | 'be' | 'bg' | 'bn' | 'bs'
  | 'ca' | 'ceb' | 'cs' | 'cy' | 'da' | 'de' | 'el' | 'en'
  | 'eo' | 'es' | 'et' | 'eu' | 'fa' | 'fi' | 'fr' | 'ga'
  | 'gl' | 'gu' | 'haw' | 'he' | 'hi' | 'hmn' | 'hr' | 'ht'
  | 'hu' | 'hy' | 'id' | 'ig' | 'is' | 'it' | 'ja' | 'jw'
  | 'ka' | 'kk' | 'km' | 'kn' | 'ko' | 'ku' | 'ky' | 'la'
  | 'lb' | 'lo' | 'lt' | 'lv' | 'mg' | 'mi' | 'mk' | 'ml'
  | 'mn' | 'mr' | 'ms' | 'mt' | 'my' | 'ne' | 'nl' | 'no'
  | 'ny' | 'pa' | 'pl' | 'ps' | 'pt' | 'ro' | 'ru' | 'rw'
  | 'sd' | 'si' | 'sk' | 'sl' | 'sm' | 'sn' | 'so' | 'sq'
  | 'sr' | 'st' | 'su' | 'sv' | 'sw' | 'ta' | 'te' | 'tg'
  | 'th' | 'tl' | 'tr' | 'uk' | 'ur' | 'uz' | 'vi' | 'xh'
  | 'yi' | 'yo' | 'zh' | 'zu';
```

---

이 타입들은 `/types` 디렉토리 또는 GraphQL/REST API 스펙 변환기로 자동 생성될 수도 있으며, 프론트/백엔드 간 데이터 충돌 방지에 핵심적입니다.
