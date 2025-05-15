import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import { POI, POI_TYPE_ICONS } from '../../types/poi';

interface POIMarkerProps {
  poi: POI;
  onPress?: (poi: POI) => void;
  selected?: boolean;
  zIndex?: number;
}

/**
 * POI를 지도 마커로 표시하는 컴포넌트
 */
const POIMarker = ({ poi, onPress, selected = false, zIndex = 0 }: POIMarkerProps) => {
  // POI 타입에 맞는 아이콘 정보 가져오기
  const iconInfo = POI_TYPE_ICONS[poi.type];
  
  // 마커 선택 시 콜백 처리
  const handlePress = () => {
    if (onPress) {
      onPress(poi);
    }
  };

  return (
    <Marker
      coordinate={{ latitude: poi.lat, longitude: poi.lon }}
      onPress={handlePress}
      tracksViewChanges={false}
      zIndex={selected ? 1000 : zIndex}
    >
      <View style={[
        styles.markerContainer,
        { backgroundColor: selected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)' },
        selected && styles.selectedMarker
      ]}>
        <Icon 
          name={iconInfo.iconName} 
          size={selected ? 22 : 18} 
          color={iconInfo.color} 
        />
        {selected && (
          <Text style={styles.markerTitle} numberOfLines={1}>
            {poi.name}
          </Text>
        )}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  selectedMarker: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#3482F6',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerTitle: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 150,
  }
});

// 메모이제이션을 통한 리렌더링 최적화
export default memo(POIMarker, (prevProps, nextProps) => {
  // POI ID가 같고 선택 상태가 같으면 리렌더링 방지
  return (
    prevProps.poi.id === nextProps.poi.id &&
    prevProps.selected === nextProps.selected
  );
}); 