import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  ScrollView
} from 'react-native';
import MapView, { Region, UrlTile, PROVIDER_DEFAULT, Marker } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGeolocation } from '../hooks/useGeolocation';
import POILayer from '../components/map/POILayer';
import { POI, POIType } from '../types/poi';
import { regionToZoom, zoomToRegionDelta } from '../services/mapping/tileSystem';

const { width, height } = Dimensions.get('window');

// 타일 URL - 라벨 있는 버전과 없는 버전
const LABEL_TILE = "http://c.tile.openstreetmap.org/{z}/{x}/{y}.png";
const NO_LABEL_TILE = "https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png";

// 최소/최대 확대/축소 레벨
const MIN_ZOOM = 2; // 최소 줌 레벨 (가장 축소된 상태)
const MAX_ZOOM = 18; // 최대 줌 레벨 (가장 확대된 상태)

const MapScreen: React.FC = () => {
  // 지도 레퍼런스 및 상태
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 37.5665,
    longitude: 126.9780,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [zoomLevel, setZoomLevel] = useState(regionToZoom(region)); 
  const [showLabels, setShowLabels] = useState(true);
  
  // 검색 관련 상태
  const [searchText, setSearchText] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // POI 관련 상태
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [showPOIDetail, setShowPOIDetail] = useState(false);
  
  // 필터 관련 상태
  const [poiFilter, setPoiFilter] = useState<POIType[]>([
    POIType.MUSEUM,
    POIType.ART_GALLERY,
    POIType.MONUMENT,
    POIType.HISTORIC
  ]);
  
  // 위치 정보 훅 사용
  const { location, loading: locationLoading, getCurrentLocation } = useGeolocation();
  
  // 지도 영역 변경 핸들러
  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
    setZoomLevel(regionToZoom(newRegion));
  };
  
  // 줌 인/아웃 처리
  const handleZoom = (type: 'in' | 'out') => {
    if (!mapRef.current) return;
    
    let newZoom = type === 'in' ? zoomLevel + 1 : zoomLevel - 1;
    
    // 확대/축소 제한
    newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    
    if (newZoom === zoomLevel) return;
    
    const { latitudeDelta, longitudeDelta } = zoomToRegionDelta(newZoom);
    
    mapRef.current.animateToRegion({
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta,
      longitudeDelta,
    }, 300);
    
    setZoomLevel(newZoom);
  };
  
  // 현재 위치로 이동
  const moveToCurrentLocation = useCallback(() => {
    if (!location || !mapRef.current) return;
    
    mapRef.current.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  }, [location]);
  
  // POI 클릭 처리
  const handlePOIPress = (poi: POI) => {
    setSelectedPOI(poi);
    setShowPOIDetail(true);
  };
  
  // 검색 실행
  const handleSearch = () => {
    // 검색 로직은 POILayer 컴포넌트에 nameFilter 전달
    setIsSearchFocused(false);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* 지도 영역 */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChange}
      >
        {/* 타일 레이어 */}
        <UrlTile
          urlTemplate={showLabels ? LABEL_TILE : NO_LABEL_TILE}
          maximumZ={19}
          flipY={false}
        />
        
        {/* 현재 위치 마커 */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="내 위치"
          >
            <View style={styles.myLocationMarker}>
              <View style={styles.myLocationMarkerCore} />
            </View>
          </Marker>
        )}
        
        {/* POI 레이어 */}
        <POILayer
          region={region}
          poiTypes={poiFilter}
          nameFilter={searchText}
          onPOIPress={handlePOIPress}
        />
      </MapView>
      
      {/* 상단 검색바 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={22} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="박물관, 유적지 등 검색..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* 컨트롤 버튼 */}
      <View style={styles.controlsContainer}>
        {/* 줌 컨트롤 */}
        <View style={styles.zoomControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => handleZoom('in')}
          >
            <Ionicons name="add" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => handleZoom('out')}
          >
            <Ionicons name="remove" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        {/* 기타 컨트롤 */}
        <View style={styles.mapControls}>
          {/* 라벨 표시/숨김 */}
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setShowLabels(!showLabels)}
          >
            <Ionicons name={showLabels ? "text" : "text-outline"} size={20} color="#333" />
          </TouchableOpacity>
          
          {/* 현재 위치 */}
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={locationLoading ? undefined : moveToCurrentLocation}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color="#333" />
            ) : (
              <Ionicons name="locate" size={20} color="#333" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* POI 상세 정보 모달 */}
      <Modal
        visible={showPOIDetail && selectedPOI !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPOIDetail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPOI?.name}</Text>
              <TouchableOpacity 
                onPress={() => setShowPOIDetail(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {selectedPOI?.address && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color="#666" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{selectedPOI.address}</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={20} color="#666" style={styles.infoIcon} />
                <Text style={styles.infoText}>
                  {selectedPOI?.type === POIType.MUSEUM && '박물관'}
                  {selectedPOI?.type === POIType.ART_GALLERY && '미술관'}
                  {selectedPOI?.type === POIType.MONUMENT && '기념물'}
                  {selectedPOI?.type === POIType.MEMORIAL && '추모관'}
                  {selectedPOI?.type === POIType.HISTORIC && '역사 유적지'}
                  {selectedPOI?.type === POIType.ARCHAEOLOGICAL_SITE && '고고학 유적지'}
                </Text>
              </View>
              
              {selectedPOI?.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionText}>{selectedPOI.description}</Text>
                </View>
              )}
              
              {/* 태그 정보 표시 */}
              {selectedPOI?.tags && Object.keys(selectedPOI.tags).length > 0 && (
                <View style={styles.tagsContainer}>
                  <Text style={styles.sectionTitle}>기타 정보</Text>
                  {Object.entries(selectedPOI.tags)
                    .filter(([key]) => !['name', 'description', 'addr:full'].includes(key))
                    .map(([key, value]) => (
                      <View key={key} style={styles.tagRow}>
                        <Text style={styles.tagKey}>{key}:</Text>
                        <Text style={styles.tagValue}>{value}</Text>
                      </View>
                    ))
                  }
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="navigate" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>길 찾기</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="bookmark" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>저장</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-social" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>공유</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    zIndex: 5,
  },
  zoomControls: {
    marginBottom: 10,
  },
  mapControls: {
    marginTop: 10,
  },
  controlButton: {
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  myLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myLocationMarkerCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
    maxHeight: height * 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#444',
    flex: 1,
  },
  descriptionContainer: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  tagsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  tagKey: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  tagValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 15,
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default MapScreen; 