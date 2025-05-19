

# ⚙️ 환경변수 설정 참조 (env-config-reference.md)

TravelAI 프로젝트에서 사용되는 주요 환경변수 목록과 설정 목적을 설명합니다. 이 문서는 `.env` 또는 `.env.*` 파일 및 서버 환경에서 필요한 설정 값을 명확히 하기 위해 작성되었습니다.

---

## 📦 공통 환경변수

| 변수명 | 예시 값 | 설명 |
|--------|---------|------|
| `NODE_ENV` | `development` / `production` | 실행 환경 구분 |
| `PORT` | `3000` | API 서버 포트 번호 |
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error` | 로그 출력 레벨 |

---

## 🧠 GPT / OpenAI 설정

| 변수명 | 예시 값 | 설명 |
|--------|---------|------|
| `OPENAI_API_KEY` | `sk-xxxxxxxxxxxx` | OpenAI API 호출용 Secret 키 |
| `OPENAI_MODEL` | `gpt-4` | 기본 사용 모델 이름 |
| `GPT_TIMEOUT` | `15000` | GPT 요청 타임아웃(ms) |

---

## 🌍 번역 / 다국어 설정

| 변수명 | 예시 값 | 설명 |
|--------|---------|------|
| `TRANSLATION_PROVIDER` | `openai` / `deepl` | 번역 서비스 선택 |
| `DEFAULT_LOCALE` | `en` | 시스템 기본 언어 |
| `I18N_CACHE_TTL` | `3600` | 번역 캐시 TTL (초 단위) |

---

## 🔐 인증 / 보안 설정

| 변수명 | 예시 값 | 설명 |
|--------|---------|------|
| `JWT_SECRET` | `your-secret-key` | JWT 서명용 비밀 키 |
| `JWT_EXPIRES_IN` | `1h` | Access Token 만료 시간 |
| `REDIS_URL` | `redis://localhost:6379` | Redis 연결 주소 |
| `SESSION_TTL` | `86400` | Redis 세션 TTL (초 단위) |

---

## 🛰️ 외부 API / 네트워크

| 변수명 | 예시 값 | 설명 |
|--------|---------|------|
| `BASE_API_URL` | `https://api.travelai.io` | 클라이언트용 기본 API 주소 |
| `ENABLE_SWAGGER` | `true` / `false` | Swagger UI 노출 여부 |

---

## 🐞 개발 / 로컬 설정

| 변수명 | 예시 값 | 설명 |
|--------|---------|------|
| `DEBUG_USER_ID` | `abc123` | 디버깅용 유저 고정 ID |
| `MOCK_MODE` | `true` | GPT/번역 응답 Mock 모드 여부 |

---

## 📁 경로 관련

| 변수명 | 예시 값 | 설명 |
|--------|---------|------|
| `CURATION_PROMPT_PATH` | `config/curation-prompts/default.yaml` | 큐레이션 프롬프트 YAML 경로 |
| `I18N_RESOURCES_PATH` | `locales/` | 다국어 리소스 파일 경로 |

---

## 📌 주의 사항

- `.env` 파일은 Git에 커밋되지 않도록 `.gitignore`에 반드시 포함시켜야 합니다.
- 민감한 API 키는 별도의 Secret Vault 또는 인프라 환경변수로 관리 권장

---

## ✅ 참고 문서

- [translation-cache-strategy.md](./translation-cache-strategy.md)
- [language-support.md](./language-support.md)
- [curation-prompt-rules.md](./curation-prompt-rules.md)