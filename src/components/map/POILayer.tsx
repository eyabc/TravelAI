import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Region } from 'react-native-maps';
import { POI, POIType } from '../../types/poi';
import { useTilePOIs } from '../../hooks/useTilePOIs';
import POIMarker from './POIMarker';

interface POILayerProps {
  region: Region;
  onPOIPress?: (poi: POI) => void;
  poiTypes?: POIType[];
  nameFilter?: string;
  maxPOIs?: number;
}

/**
 * POI 레이어 컴포넌트
 */
const POILayer: React.FC<POILayerProps> = ({ 
  region, 
  onPOIPress,
  poiTypes,
  nameFilter,
  maxPOIs = 100
}) => {
  // 선택된 POI 관리
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  
  // POI 데이터 로드 훅 사용
  const { pois, loading, updateTiles } = useTilePOIs(region, {
    poiTypes,
    nameFilter,
    maxPOIs
  });
  
  // 지도 영역이 변경될 때 POI 데이터 업데이트
  useEffect(() => {
    updateTiles(region);
  }, [region, poiTypes, nameFilter, updateTiles]);
  
  // POI 클릭 처리
  const handlePOIPress = useCallback((poi: POI) => {
    setSelectedPOI(poi);
    if (onPOIPress) {
      onPOIPress(poi);
    }
  }, [onPOIPress]);
  
  return (
    <>
      {/* 마커 렌더링 */}
      {pois.map(poi => (
        <POIMarker
          key={poi.id}
          poi={poi}
          onPress={handlePOIPress}
          selected={selectedPOI?.id === poi.id}
        />
      ))}
      
      {/* 로딩 인디케이터 */}
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default POILayer; 