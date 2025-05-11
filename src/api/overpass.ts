import { OSMElement, POI, POIType } from '../types/poi';
import { BBox } from '../services/mapping/tileSystem';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

/**
 * POI 타입에 따른 Overpass API 쿼리 태그 매핑
 */
const POI_TYPE_QUERY_MAPPING: Record<string, string> = {
  'museum': '"tourism"="museum"',
  'art_gallery': '"tourism"="gallery"',
  'monument': '"historic"="monument"',
  'memorial': '"historic"="memorial"',
  'archaeological_site': '"historic"="archaeological_site"',
  'historic': '"historic"="yes"',
  'attraction': '"tourism"="attraction"',
  'viewpoint': '"tourism"="viewpoint"',
  'restaurant': '"amenity"="restaurant"',
  'cafe': '"amenity"="cafe"',
  'hotel': '"tourism"="hotel"'
};

/**
 * OSM 태그에서 POI 타입 결정
 * @param tags OSM 엘리먼트 태그
 * @returns POI 타입
 */
function determinePOIType(tags: Record<string, string> = {}): POIType {
  if (tags.tourism === 'museum') return POIType.MUSEUM;
  if (tags.tourism === 'gallery' || tags.tourism === 'art_gallery') return POIType.ART_GALLERY;
  if (tags.historic === 'monument') return POIType.MONUMENT;
  if (tags.historic === 'memorial') return POIType.MEMORIAL;
  if (tags.historic === 'archaeological_site') return POIType.ARCHAEOLOGICAL_SITE;
  if (tags.historic === 'yes') return POIType.HISTORIC;
  if (tags.tourism === 'attraction') return POIType.ATTRACTION;
  if (tags.tourism === 'viewpoint') return POIType.VIEWPOINT;
  if (tags.amenity === 'restaurant') return POIType.RESTAURANT;
  if (tags.amenity === 'cafe') return POIType.CAFE;
  if (tags.tourism === 'hotel') return POIType.HOTEL;
  if (tags.tourism === 'information' || tags.amenity === 'information') return POIType.INFORMATION;
  
  return POIType.OTHER;
}

/**
 * OSM 엘리먼트를 POI 객체로 변환
 * @param element OSM 엘리먼트
 * @returns POI 객체
 */
export function convertOsmElementToPOI(element: OSMElement): POI | null {
  // 위치 정보가 없으면 null 반환
  if ((!element.lat || !element.lon) && (!element.center?.lat || !element.center?.lon)) {
    return null;
  }
  
  const lat = element.lat || element.center?.lat || 0;
  const lon = element.lon || element.center?.lon || 0;
  
  const tags = element.tags || {};
  const name = tags.name || '이름 없음';
  const type = determinePOIType(tags);
  
  // 주소 정보 조합
  const address = tags['addr:full'] || 
    [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'],
      tags['addr:postcode']
    ].filter(Boolean).join(', ') || undefined;
  
  return {
    id: `${element.type}-${element.id}`,
    name,
    lat,
    lon,
    type,
    tags,
    address,
    description: tags.description || tags.note
  };
}

/**
 * 바운딩 박스 내의 POI 데이터 조회
 * @param bbox 바운딩 박스
 * @param poiTypes 가져올 POI 타입 배열
 * @param nameFilter 이름 필터 (선택)
 * @returns POI 배열
 */
export async function fetchPOIsInBBox(
  bbox: BBox,
  poiTypes: POIType[] = [],
  nameFilter?: string
): Promise<POI[]> {
  try {
    // POI 타입이 없으면 기본값 설정
    const types = poiTypes.length > 0 
      ? poiTypes 
      : [POIType.MUSEUM, POIType.ART_GALLERY, POIType.MONUMENT, POIType.MEMORIAL, 
         POIType.ARCHAEOLOGICAL_SITE, POIType.HISTORIC, POIType.ATTRACTION];
    
    // 쿼리 필터 조건 생성
    const typeFilters = types
      .map(type => POI_TYPE_QUERY_MAPPING[type] || `"tourism"="${type}"`)
      .join('|');
    
    // 이름 필터 추가
    const nameFilterQuery = nameFilter ? `["name"~"${nameFilter}",i]` : '';
    
    // Overpass QL 쿼리 생성
    const query = `
      [out:json][timeout:25];
      (
        nwr[${typeFilters}]${nameFilterQuery}(${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      );
      out center tags 100;
    `;
    
    // API 요청
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }
    
    const json = await response.json();
    
    // OSM 엘리먼트를 POI 객체로 변환
    const pois = (json.elements || [])
      .map((element: OSMElement) => convertOsmElementToPOI(element))
      .filter((poi: POI | null): poi is POI => poi !== null);
    
    return pois;
  } catch (error) {
    console.error('Overpass API 호출 오류:', error);
    throw error;
  }
}

/**
 * 타일에 대한 POI 데이터 조회
 * @param tileKey 타일 키
 * @param bbox 바운딩 박스
 * @param poiTypes 가져올 POI 타입 배열
 * @param nameFilter 이름 필터 (선택)
 * @returns POI 객체와 메타데이터
 */
export async function fetchPOIsForTile(
  tileKey: string,
  bbox: BBox,
  poiTypes?: POIType[],
  nameFilter?: string
): Promise<{ tileKey: string; pois: POI[]; timestamp: number; expires: number }> {
  const pois = await fetchPOIsInBBox(bbox, poiTypes, nameFilter);
  const now = Date.now();
  const expireTime = now + 24 * 60 * 60 * 1000; // 24시간 캐시
  
  return {
    tileKey,
    pois,
    timestamp: now,
    expires: expireTime
  };
} 