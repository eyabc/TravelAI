import { useState, useEffect, useRef, useCallback } from 'react';
import { Region } from 'react-native-maps';
import { POI, POIType, TilePOIData } from '../types/poi';
import { 
  Tile, 
  BBox, 
  getTileKey, 
  getViewportTiles, 
  regionToZoom, 
  tileToBBox 
} from '../services/mapping/tileSystem';
import { fetchPOIsForTile } from '../api/overpass';
import { MemoryCache, getOrCreate } from '../utils/cache';

// 타일 데이터 캐시 (24시간 유효, 최대 200개 타일)
const tileCache = new MemoryCache<TilePOIData>(24 * 60 * 60 * 1000, 200);

// 로드 중인 타일 추적을 위한 맵 (동시 요청 방지)
const loadingTiles = new Map<string, Promise<TilePOIData>>();

interface UseTilePOIsOptions {
  poiTypes?: POIType[];
  nameFilter?: string;
  maxPOIs?: number;
}

interface UseTilePOIsResult {
  pois: POI[];
  loading: boolean;
  tiles: Tile[];
  error: Error | null;
  updateTiles: (region: Region) => void;
  clearCache: () => void;
}

/**
 * 타일 기반 POI 데이터 관리 훅
 * @param initialRegion 초기 지도 영역
 * @param options 옵션
 * @returns 타일 POI 관리 객체
 */
export function useTilePOIs(
  initialRegion: Region,
  options: UseTilePOIsOptions = {}
): UseTilePOIsResult {
  const [pois, setPois] = useState<POI[]>([]);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // 마지막으로 처리된 옵션 추적
  const lastOptionsRef = useRef<string>('');
  
  // POI 중복 제거 및 병합을 위한 유틸리티 함수
  const mergePOIs = useCallback((poiArrays: POI[][]): POI[] => {
    const poiMap = new Map<string, POI>();
    
    // 모든 POI 배열을 순회하며 중복 제거
    poiArrays.flat().forEach(poi => {
      poiMap.set(poi.id, poi);
    });
    
    // Map 값들을 배열로 변환
    return Array.from(poiMap.values());
  }, []);
  
  // 지정된 타일에 대한 POI 데이터 로드
  const loadTileData = useCallback(async (
    tile: Tile, 
    poiTypes?: POIType[], 
    nameFilter?: string
  ): Promise<TilePOIData> => {
    const tileKey = getTileKey(tile);
    
    // 이미 로드 중인 타일이면 해당 프로미스 반환
    if (loadingTiles.has(tileKey)) {
      return loadingTiles.get(tileKey)!;
    }
    
    // 새로운 요청 생성
    const loadPromise = getOrCreate(
      tileCache,
      `${tileKey}_${poiTypes?.join(',') || ''}_${nameFilter || ''}`,
      async () => {
        const bbox = tileToBBox(tile);
        return fetchPOIsForTile(tileKey, bbox, poiTypes, nameFilter);
      }
    );
    
    // 로딩 중 맵에 추가
    loadingTiles.set(tileKey, loadPromise);
    
    try {
      // 데이터 로드
      const data = await loadPromise;
      return data;
    } finally {
      // 로딩 완료 후 맵에서 제거
      loadingTiles.delete(tileKey);
    }
  }, []);
  
  // 지도 영역에 필요한 타일 업데이트
  const updateTiles = useCallback(async (region: Region) => {
    try {
      // 현재 옵션을 문자열로 직렬화하여 변경 여부 확인
      const currentOptions = JSON.stringify({
        poiTypes: options.poiTypes,
        nameFilter: options.nameFilter,
      });
      
      // 옵션이 변경되었으면 이전 POI 초기화
      if (currentOptions !== lastOptionsRef.current) {
        setPois([]);
        lastOptionsRef.current = currentOptions;
      }
      
      setLoading(true);
      setError(null);
      
      // 현재 줌 레벨 계산
      const zoom = regionToZoom(region);
      
      // 현재 뷰포트에 필요한 타일 계산
      const viewportTiles = getViewportTiles(region, zoom);
      setTiles(viewportTiles);
      
      // 각 타일에 대한 POI 데이터 로드
      const poiPromises = viewportTiles.map(tile => 
        loadTileData(tile, options.poiTypes, options.nameFilter)
      );
      
      // 모든 타일 데이터 로드 대기
      const tileDataResults = await Promise.all(poiPromises);
      
      // POI 데이터 추출 및 병합
      const poiArrays = tileDataResults.map(data => data.pois);
      const mergedPOIs = mergePOIs(poiArrays);
      
      // 최대 POI 개수 제한 적용
      const limitedPOIs = options.maxPOIs 
        ? mergedPOIs.slice(0, options.maxPOIs) 
        : mergedPOIs;
      
      setPois(limitedPOIs);
    } catch (err) {
      console.error('타일 POI 로드 오류:', err);
      setError(err instanceof Error ? err : new Error('타일 데이터 로드 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [options.poiTypes, options.nameFilter, options.maxPOIs, loadTileData, mergePOIs]);
  
  // 캐시 초기화 함수
  const clearCache = useCallback(() => {
    tileCache.clear();
    setPois([]);
  }, []);
  
  // 초기 지도 영역에 대한 타일 데이터 로드
  useEffect(() => {
    updateTiles(initialRegion);
  }, [initialRegion, updateTiles]);
  
  return {
    pois,
    loading,
    tiles,
    error,
    updateTiles,
    clearCache
  };
} 