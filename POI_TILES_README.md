# POI 타일 시스템 구현

이 프로젝트는 TravelAI 애플리케이션의 Points of Interest(POI) 타일 시스템을 구현합니다. 타일링 시스템을 사용하여 지도에서 효율적으로 관심 지점(POI)을 관리하고 표시합니다.

## 주요 기능

### 타일 시스템 (Tile System)
- 지도를 타일 단위로 분할하여 효율적인 데이터 관리 (`src/services/mapping/tileSystem.ts`)
- 위도/경도를 타일 좌표로 변환 및 역변환 로직
- 바운딩 박스(BBox) 계산 및 관리
- 줌 레벨 관리 및 계산 유틸리티

### POI 데이터 관리
- OpenStreetMap Overpass API를 통한 POI 데이터 검색 (`src/api/overpass.ts`)
- 박물관, 미술관, 기념물, 유적지 등 다양한 POI 유형 지원
- POI 타입별 아이콘 및 색상 스타일링 (`src/types/poi.ts`)

### 메모리 캐싱 시스템
- 효율적인 메모리 사용을 위한 캐싱 메커니즘 (`src/utils/cache.ts`)
- 타일 데이터의 시간 기반 캐싱 및 만료 관리
- 캐시 크기 제한 및 자동 정리 기능

### 커스텀 훅 및 컴포넌트
- `useTilePOIs` 훅을 통한 타일 단위 POI 데이터 관리 (`src/hooks/useTilePOIs.ts`)
- `useGeolocation` 훅을 통한 기기 위치 정보 관리 (`src/hooks/useGeolocation.ts`)
- `POIMarker` 컴포넌트로 지도 위 마커 렌더링 (`src/components/map/POIMarker.tsx`)
- `POILayer` 컴포넌트로 지도에 레이어 표시 (`src/components/map/POILayer.tsx`)

### 사용자 인터페이스
- 사용자 친화적인 지도 인터페이스 (`src/screens/MapScreen.tsx`)
- 타일 레이어 활성화/비활성화 기능
- 줌 인/아웃 및 현재 위치 표시 기능
- POI 상세 정보 모달

## 기술 스택
- React Native
- TypeScript
- react-native-maps
- OpenStreetMap 및 Overpass API

## 아키텍처

프로젝트는 다음과 같은 구조로 구성됩니다:

```
src/
  ├── api/               # API 호출 관련 코드
  ├── components/        # 재사용 가능한 컴포넌트
  │   ├── common/        # 공통 컴포넌트
  │   └── map/           # 지도 관련 컴포넌트
  ├── hooks/             # 커스텀 React 훅
  ├── screens/           # 화면 컴포넌트
  ├── services/          # 핵심 서비스 로직
  │   └── mapping/       # 지도 관련 서비스
  ├── types/             # 타입 정의
  └── utils/             # 유틸리티 함수
```

## 구현 전략

1. **타일 기반 접근방식**: 지도를 타일로 분할하여 필요한 영역의 POI 데이터만 로드합니다.
2. **메모리 캐싱**: 이미 로드된 타일 데이터를 메모리에 캐시하여 불필요한 API 호출을 줄입니다.
3. **성능 최적화**: 마커 렌더링 최적화, 메모이제이션 등을 통해 지도 성능을 향상시킵니다.
4. **사용자 경험**: 직관적인 인터페이스와 빠른 응답성을 통해 우수한 사용자 경험을 제공합니다.

## 향후 개선사항

- 오프라인 사용을 위한 영구 캐싱 구현
- POI 필터링 및 검색 기능 개선
- 다양한 타일 제공자 지원
- 커스텀 POI 추가 및 관리 기능 