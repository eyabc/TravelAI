import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { POI, POI_TYPE_ICONS, POIType } from '../../types/poi';

interface POIMarkerProps {
  poi: POI;
  onPress?: (poi: POI) => void;
  selected?: boolean;
}

/**
 * POI 마커 컴포넌트
 */
const POIMarker: React.FC<POIMarkerProps> = ({ poi, onPress, selected }) => {
  // POI 유형에 따른 아이콘 정보 가져오기
  const iconInfo = POI_TYPE_ICONS[poi.type] || POI_TYPE_ICONS[POIType.OTHER];
  
  // 마커 크기 (선택 시 더 크게)
  const markerSize = selected ? 40 : 32;
  const iconSize = selected ? 22 : 18;
  
  return (
    <Marker
      coordinate={{
        latitude: poi.lat,
        longitude: poi.lon
      }}
      title={poi.name}
      description={poi.address}
      onPress={() => onPress && onPress(poi)}
      tracksViewChanges={false}
    >
      <View
        style={[
          styles.markerContainer,
          {
            backgroundColor: iconInfo.color,
            width: markerSize,
            height: markerSize,
            borderWidth: selected ? 2 : 0,
          }
        ]}
      >
        <Ionicons
          name={iconInfo.iconName}
          size={iconSize}
          color="#FFFFFF"
        />
      </View>
      {selected && (
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>{poi.name}</Text>
        </View>
      )}
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderColor: '#FFFFFF',
  },
  labelContainer: {
    position: 'absolute',
    bottom: -26,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'center',
    maxWidth: 150,
  },
  labelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

// 불필요한 리렌더링 방지를 위한 메모이제이션
export default memo(POIMarker, (prevProps, nextProps) => {
  return (
    prevProps.poi.id === nextProps.poi.id &&
    prevProps.selected === nextProps.selected
  );
}); 