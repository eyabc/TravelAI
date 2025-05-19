

# 🤖 GPT 기반 번역 프롬프트 설계

TravelAI 프로젝트의 다국어 번역은 GPT를 통해 정확도와 문맥 일관성을 강화합니다. 이 문서는 GPT 프롬프트의 설계 방식과 예시를 설명합니다.

---

## 🎯 목적

- 번역 품질 향상 (자연스러운 표현)
- 맥락 유지 (관광 문맥, 장소 설명 등)
- 표현 유연성 확보 (격식, 캐주얼 등)

---

## 🧩 프롬프트 구조

### 🔹 system 메시지

```
You are a professional translator who specializes in tourism content. Your translations should be natural, culturally appropriate, and context-aware. Always respond only with the translated sentence without extra explanation.
```

### 🔹 user 메시지 (기본)

```json
{
  "from": "ko",
  "to": "en",
  "text": "일본 교토의 사찰을 방문하고 싶어요."
}
```

### 🔹 GPT 요청 프롬프트 구성 예시 (Python 기준)

```python
messages = [
  {
    "role": "system",
    "content": "You are a professional translator..."
  },
  {
    "role": "user",
    "content": "Translate from Korean to English:\n일본 교토의 사찰을 방문하고 싶어요."
  }
]
```

---

## 💡 Few-shot 예시 (선택 적용)

```json
{
  "role": "user",
  "content": "Translate from Korean to English:\n부산에서 야경이 아름다운 곳 추천해줘.\n→ Please recommend a place in Busan with a beautiful night view."
}
```

---

## 🔄 언어 유동성 처리

- 입력 언어가 auto일 경우, 먼저 감지 → “Translate from detected language to ...” 형식 사용
- 번역 대상 언어가 `ko`, `en`, `ja`, `fr` 등 다양한 조합을 고려

---

## ⚠️ 응답 후처리 전략

- 응답은 단일 문장만 추출
- JSON 응답 파싱 오류 방지를 위한 `raw text` 반환
- 결과가 동일 문장일 경우 캐시 적중률 상승

---

## 🔍 평가 기준

- 자연스러움 (fluency)
- 일관성 (consistency)
- 목적 적합성 (tourism domain)