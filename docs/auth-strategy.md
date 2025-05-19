

# 🔐 인증 전략 (Authentication Strategy)

TravelAI는 안전한 사용자 인증과 다양한 인증 방식을 제공하기 위해 다음과 같은 전략을 채택합니다.

---

## 🎯 인증 목적

- 사용자 식별 및 권한 분리
- API 접근 제어 및 세션 관리
- 소셜 로그인 등 외부 인증 연동
- 비로그인 사용자의 제한된 접근 허용

---

## 🔑 기본 인증 흐름

1. 사용자가 이메일/비밀번호로 로그인 요청
2. 서버는 JWT Access Token + Refresh Token 발급
3. 클라이언트는 Access Token을 Authorization 헤더에 포함하여 API 요청
4. Access Token 만료 시 Refresh Token을 통해 재발급

---

## 🧾 JWT 구성

- **Access Token**
  - 만료: 15분~1시간
  - 용도: API 요청 인증
  - Payload 예시:
    ```json
    {
      "sub": "user_id_abc123",
      "email": "user@example.com",
      "role": "user",
      "locale": "ko"
    }
    ```

- **Refresh Token**
  - 만료: 7일~30일
  - Redis에 저장 (세션 관리 가능)
  - 탈취 대응을 위해 1회성 또는 고유 식별자 사용 권장

---

## 🌍 소셜 로그인 전략

- Google OAuth2를 시작으로, Apple, Kakao 등 점진적 확장
- JWT 발급은 소셜 프로필 정보 기반으로 처리
- 신규 사용자는 자동 회원가입 처리
- 기존 이메일과 충돌 시 병합 UI 안내 예정

---

## 🧠 언어 및 로케일 처리

- 로그인 성공 시 사용자의 locale 정보 저장 (ex: Redis 세션 or DB)
- 이후 API 요청 시 클라이언트가 언어 전송하지 않아도 됨
- 번역/큐레이션 흐름은 이 정보를 기준으로 판단됨

---

## 🛡️ 보안 고려사항

- 비밀번호는 bcrypt 또는 argon2로 해싱 저장
- 로그인 실패 횟수 제한 및 Rate Limiting 적용
- Refresh Token 탈취 방지를 위한 Redis 연동 설계
- OAuth 토큰 검증 시 JWKS / 공개키 캐싱 사용

---

## 🪪 향후 확장 계획

- WebAuthn 기반 패스워드리스 로그인
- OTP / 이메일 인증 연동
- 기기/브라우저 기반 세션 제한
- 관리자 전용 2FA

---

## 📎 관련 문서

- [rate-limit-policy.md](./rate-limit-policy.md)
- [api-contracts.md](./api-contracts.md)
- [env-config-reference.md](./env-config-reference.md)