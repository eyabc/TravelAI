import { Region } from 'react-native-maps';

/**
 * 타일 좌표 인터페이스
 */
export interface Tile {
  x: number;
  y: number;
  z: number; // 줌 레벨
}

/**
 * 바운딩 박스 인터페이스
 */
export interface BBox {
  north: number; // 최대 위도
  south: number; // 최소 위도
  east: number;  // 최대 경도
  west: number;  // 최소 경도
}

/**
 * 위도/경도에서 타일 좌표로 변환
 * @param lat 위도
 * @param lng 경도
 * @param zoom 줌 레벨
 * @returns 타일 좌표 객체
 */
export function latLngToTile(lat: number, lng: number, zoom: number): Tile {
  const n = 2.0 ** zoom;
  const x = Math.floor((lng + 180.0) / 360.0 * n);
  
  const latRad = (lat * Math.PI) / 180.0;
  const y = Math.floor((1.0 - Math.log(Math.tan(latRad) + (1.0 / Math.cos(latRad))) / Math.PI) / 2.0 * n);
  
  return { x, y, z: zoom };
}

/**
 * 타일 좌표에서 바운딩 박스로 변환
 * @param tile 타일 좌표 객체
 * @returns 바운딩 박스 객체
 */
export function tileToBBox(tile: Tile): BBox {
  const n = 2.0 ** tile.z;
  
  const west = (tile.x / n) * 360.0 - 180.0;
  const east = ((tile.x + 1) / n) * 360.0 - 180.0;
  
  const northRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * tile.y / n)));
  const southRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tile.y + 1) / n)));
  
  const north = (northRad * 180.0) / Math.PI;
  const south = (southRad * 180.0) / Math.PI;
  
  return { north, south, east, west };
}

/**
 * Region 객체에서 바운딩 박스로 변환
 * @param region 지도 영역 객체
 * @returns 바운딩 박스 객체
 */
export function regionToBBox(region: Region): BBox {
  const latDelta = region.latitudeDelta / 2;
  const lngDelta = region.longitudeDelta / 2;
  
  return {
    north: region.latitude + latDelta,
    south: region.latitude - latDelta,
    east: region.longitude + lngDelta,
    west: region.longitude - lngDelta
  };
}

/**
 * 바운딩 박스가 겹치는지 확인
 * @param bbox1 첫 번째 바운딩 박스
 * @param bbox2 두 번째 바운딩 박스
 * @returns 겹치면 true, 아니면 false
 */
export function bboxOverlaps(bbox1: BBox, bbox2: BBox): boolean {
  return !(
    bbox1.west > bbox2.east ||
    bbox1.east < bbox2.west ||
    bbox1.south > bbox2.north ||
    bbox1.north < bbox2.south
  );
}

/**
 * 줌 레벨에서 Region의 델타 값 계산
 * @param zoom 줌 레벨
 * @returns { latitudeDelta, longitudeDelta } 객체
 */
export function zoomToRegionDelta(zoom: number): { latitudeDelta: number; longitudeDelta: number } {
  const latitudeDelta = 360 / (2 ** zoom);
  const longitudeDelta = 360 / (2 ** zoom);
  
  return { latitudeDelta, longitudeDelta };
}

/**
 * Region에서 줌 레벨 계산
 * @param region 지도 영역 객체
 * @returns 줌 레벨 (정수)
 */
export function regionToZoom(region: Region): number {
  return Math.round(Math.log2(360 / region.latitudeDelta));
}

/**
 * 현재 보이는 지도 영역에 필요한 모든 타일 계산
 * @param region 지도 영역 객체
 * @param zoom 줌 레벨
 * @returns 타일 배열
 */
export function getViewportTiles(region: Region, zoom: number): Tile[] {
  const bbox = regionToBBox(region);
  
  // 북서쪽 모서리와 남동쪽 모서리에서 타일 계산
  const northWestTile = latLngToTile(bbox.north, bbox.west, zoom);
  const southEastTile = latLngToTile(bbox.south, bbox.east, zoom);
  
  const tiles: Tile[] = [];
  
  // 모든 타일 범위를 순회하며 타일 생성
  for (let x = northWestTile.x; x <= southEastTile.x; x++) {
    for (let y = northWestTile.y; y <= southEastTile.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  
  return tiles;
}

/**
 * 타일 좌표에서 고유 식별자 생성
 * @param tile 타일 좌표 객체
 * @returns 타일 식별자 문자열
 */
export function getTileKey(tile: Tile): string {
  return `${tile.z}_${tile.x}_${tile.y}`;
}

/**
 * 특정 위도 경도가 바운딩 박스 내에 있는지 확인
 * @param lat 위도
 * @param lng 경도
 * @param bbox 바운딩 박스
 * @returns 바운딩 박스 내에 있으면 true, 아니면 false
 */
export function isPointInBBox(lat: number, lng: number, bbox: BBox): boolean {
  return (
    lat <= bbox.north &&
    lat >= bbox.south &&
    lng <= bbox.east &&
    lng >= bbox.west
  );
} 