
# 🎨 TravelAI UI 스타일 가이드

---

## ✅ 1. 색상 시스템 (Color Palette)

| 목적           | 색상 코드     | 설명                    |
| ------------ | --------- | --------------------- |
| Primary      | `#1A1A1A` | 주요 텍스트/버튼 색 (딥 블랙)    |
| Accent       | `#007AFF` | 강조 버튼/링크 색 (애플 블루 계열) |
| Background   | `#FFFFFF` | 기본 배경 (화이트)           |
| Secondary BG | `#F7F8FA` | 입력창/카드 배경             |
| Border       | `#E0E0E0` | 구분선, 입력창 테두리          |
| Error        | `#FF3B30` | 오류 메시지, 검증 실패 시       |
| Success      | `#34C759` | 완료 알림, 유효성 통과         |

---

## ✅ 2. 타이포그래피 (Typography)

| 스타일      | 크기(px) | 굵기      | 용도             |
| -------- | ------ | ------- | -------------- |
| Headline | 24     | Bold    | 질문 제목, 메인 타이틀  |
| Subtitle | 18     | Medium  | 세부 제목, 안내 메시지  |
| Body     | 16     | Regular | 일반 텍스트, 선택지 설명 |
| Caption  | 14     | Light   | 보조 설명, 오류 메시지  |

* **폰트 제안**:

  * 한글: `Noto Sans KR`, `Pretendard`
  * 영문: `Inter`, `Roboto`

---

## ✅ 3. 버튼 스타일

### 🔘 Primary Button (e.g., 로그인, 다음)

```css
background-color: #1A1A1A;
color: #FFFFFF;
border-radius: 8px;
padding: 12px 20px;
font-weight: bold;
```

### ⚪️ Secondary Button (토글 버튼 / 선택지)

```css
background-color: #FFFFFF;
border: 1px solid #E0E0E0;
color: #1A1A1A;
border-radius: 8px;
padding: 10px 16px;
```

### 🔺 Error Button (긴급 경고 알림 확인 등)

```css
background-color: #FF3B30;
color: #FFFFFF;
```

---

## ✅ 4. 입력 필드 (Input Fields)

```css
background-color: #FFFFFF;
border: 1px solid #E0E0E0;
border-radius: 6px;
padding: 12px;
font-size: 16px;
placeholder-color: #999999;
```

* 상태별:

  * Focused: `border: 1px solid #007AFF`
  * Error: `border: 1px solid #FF3B30`

---

## ✅ 5. 카드/컨테이너 스타일 (Cards)

```css
background-color: #FFFFFF;
box-shadow: 0px 1px 4px rgba(0,0,0,0.05);
border-radius: 12px;
padding: 16px;
```

* 사용처: 명소 추천, 일정 요약

---

## ✅ 6. 네비게이션 & 아이콘

### 📱 하단 네비게이션 바

| 아이콘    | 용도             | 설명 |
| ------ | -------------- | -- |
| 🧭 추천  | 메인 화면 이동       |    |
| 📍 위치  | 위치 기반 명소       |    |
| 🔔 알림  | 긴급/시스템 알림      |    |
| 🗂 게시판 | 여행자 피드백, 경험 공유 |    |

* 아이콘 스타일: `line` 혹은 `filled`, 크기 `24px`, 색상 `#999999` (기본) / `#007AFF` (활성화)

---

## ✅ 7. 여백 및 레이아웃 (Spacing)

| 요소        | 단위(px) | 설명          |
| --------- | ------ | ----------- |
| 기본 여백     | 16px   | 카드 간, 화면 양측 |
| 버튼 상하 여백  | 20px   | 시각적 안정감 확보  |
| 타이틀과 본문 간 | 12px   | 정보 블록 구분    |
| 컴포넌트 간    | 8px    | 최소 거리 기준    |

---

## ✅ 8. 반응형 디자인 기준

* 모바일 기준 해상도: `360 ~ 414px` 너비 기준
* 컨테이너 최대 너비: `100%`, 내부 요소 `padding: 16px`
* 텍스트는 자동 줄바꿈 허용
* 버튼은 `min-width: 160px`, `max-width: 100%`

---

## ✅ 9. 상태 피드백 UX

| 상황       | 처리 방식                     |
| -------- | ------------------------- |
| API 요청 중 | 버튼 로딩 인디케이터, 버튼 비활성화      |
| 오류 발생    | 입력 하단에 빨간 메시지 + 강조 테두리    |
| 저장 완료    | 상단 Snackbar 알림: "저장되었습니다" |

---

## ✅ 10. 다크모드 대응 (선택사항)

| 요소     | 다크모드 색상   |
| ------ | --------- |
| 배경     | `#121212` |
| 텍스트    | `#FFFFFF` |
| 카드/입력창 | `#1E1E1E` |
| 테두리    | `#333333` |
