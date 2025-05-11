/**
 * POI(Points of Interest) 기본 인터페이스
 */
export interface POI {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: POIType;
  tags?: Record<string, string>;
  address?: string;
  description?: string;
  iconUrl?: string;
}

/**
 * OpenStreetMap 원시 엘리먼트 인터페이스
 */
export interface OSMElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
}

/**
 * POI 타입 열거형
 */
export enum POIType {
  MUSEUM = 'museum',
  ART_GALLERY = 'art_gallery',
  MONUMENT = 'monument',
  MEMORIAL = 'memorial',
  ARCHAEOLOGICAL_SITE = 'archaeological_site',
  HISTORIC = 'historic',
  ATTRACTION = 'attraction',
  VIEWPOINT = 'viewpoint',
  RESTAURANT = 'restaurant',
  CAFE = 'cafe',
  HOTEL = 'hotel',
  INFORMATION = 'information',
  OTHER = 'other'
}

/**
 * POI 아이콘 정보 인터페이스
 */
export interface POIIcon {
  type: POIType;
  iconName: string;
  color: string;
}

/**
 * 타일 내 POI 데이터 인터페이스
 */
export interface TilePOIData {
  tileKey: string;
  pois: POI[];
  timestamp: number;
  expires: number;
}

/**
 * POI 검색 옵션 인터페이스
 */
export interface POISearchOptions {
  nameFilter?: string;
  types?: POIType[];
  maxResults?: number;
  sortByDistance?: boolean;
  referencePoint?: {
    lat: number;
    lon: number;
  };
}

/**
 * POI 타입 관련 상수 정의
 */
export const POI_TYPE_ICONS: Record<POIType, POIIcon> = {
  [POIType.MUSEUM]: { type: POIType.MUSEUM, iconName: 'museum', color: '#5856D6' },
  [POIType.ART_GALLERY]: { type: POIType.ART_GALLERY, iconName: 'palette', color: '#AF52DE' },
  [POIType.MONUMENT]: { type: POIType.MONUMENT, iconName: 'location', color: '#FF2D55' },
  [POIType.MEMORIAL]: { type: POIType.MEMORIAL, iconName: 'flower', color: '#FF9500' },
  [POIType.ARCHAEOLOGICAL_SITE]: { type: POIType.ARCHAEOLOGICAL_SITE, iconName: 'hammer', color: '#A2845E' },
  [POIType.HISTORIC]: { type: POIType.HISTORIC, iconName: 'time', color: '#8E8E93' },
  [POIType.ATTRACTION]: { type: POIType.ATTRACTION, iconName: 'star', color: '#FFD60A' },
  [POIType.VIEWPOINT]: { type: POIType.VIEWPOINT, iconName: 'eye', color: '#5AC8FA' },
  [POIType.RESTAURANT]: { type: POIType.RESTAURANT, iconName: 'restaurant', color: '#FF3B30' },
  [POIType.CAFE]: { type: POIType.CAFE, iconName: 'cafe', color: '#AC8E68' },
  [POIType.HOTEL]: { type: POIType.HOTEL, iconName: 'bed', color: '#30B0C7' },
  [POIType.INFORMATION]: { type: POIType.INFORMATION, iconName: 'information-circle', color: '#007AFF' },
  [POIType.OTHER]: { type: POIType.OTHER, iconName: 'location', color: '#8E8E93' }
}; 