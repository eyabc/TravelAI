import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert, Platform, PermissionsAndroid, TouchableOpacity, Text, FlatList, ActivityIndicator, Modal, Animated, Linking, TextInput } from 'react-native';
import MapView, { Marker, Region, UrlTile } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const MIN_DELTA = 0.002;
const MAX_DELTA = 1.5;

interface Museum {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
}

const LABEL_TILE = "http://c.tile.openstreetmap.org/{z}/{x}/{y}.png";
const NO_LABEL_TILE = "https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png";

// Haversine 거리 계산 함수 추가
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MapScreen = () => {
  const [region, setRegion] = useState<Region>({
    latitude: 37.523984,
    longitude: 126.980355,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [museums, setMuseums] = useState<Museum[]>([]);
  const [displayedMuseums, setDisplayedMuseums] = useState<Museum[]>([]); // 표시할 박물관 목록
  const [page, setPage] = useState(1); // 현재 페이지
  const [hasMore, setHasMore] = useState(true); // 더 불러올 데이터가 있는지
  const [loadingMuseums, setLoadingMuseums] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false); // 추가 로딩 상태
  const [showLabels, setShowLabels] = useState(true);
  const mapRef = useRef<MapView>(null);
  const [currentScale, setCurrentScale] = useState(region.latitudeDelta);
  const [showList, setShowList] = useState(false);
  const [ticker, setTicker] = useState<string | null>(null);
  const tickerAnim = useRef(new Animated.Value(0)).current;
  const [webviewUrl, setWebviewUrl] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [lastSearchTime, setLastSearchTime] = useState<number>(0);
  const searchCache = useRef<{[key: string]: {data: Museum[], timestamp: number}}>({});
  const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

  // latitudeDelta -> zoom level 변환 함수
  const getZoomLevel = (latDelta: number) => {
    // 구글/OSM 기준 대략적 변환 공식
    return Math.round(Math.log2(360 / latDelta));
  };
  const [zoomLevel, setZoomLevel] = useState(getZoomLevel(region.latitudeDelta));

  // 캐시된 데이터 가져오기
  const getCachedData = (key: string) => {
    const cached = searchCache.current[key];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  };

  // 데이터 캐시하기
  const cacheData = (key: string, data: Museum[]) => {
    searchCache.current[key] = {
      data,
      timestamp: Date.now()
    };
  };

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '위치 권한 요청',
            message: '현재 위치를 사용하려면 위치 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '거부',
            buttonPositive: '허용',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    };

    const getCurrentLocation = () => {
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        },
        error => {
          Alert.alert('위치 오류', error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    };

    requestLocationPermission().then(granted => {
      if (granted) {
        getCurrentLocation();
      } else {
        Alert.alert('권한 거부', '위치 권한이 필요합니다.');
      }
    });
  }, []);

  // region -> bounding box 변환
  const getBoundingBox = (region: Region) => {
    const latDelta = region.latitudeDelta / 2;
    const lonDelta = region.longitudeDelta / 2;
    return {
      s: region.latitude - latDelta,
      w: region.longitude - lonDelta,
      n: region.latitude + latDelta,
      e: region.longitude + lonDelta,
    };
  };

  // MAPS.ME 스타일: 지도 범위 내에서만 검색, 결과 없으면 bbox 확장
  const fetchMuseumsInRegion = async (region: Region, nameFilter: string = '', expandCount: number = 0) => {
    setLoadingMuseums(true);
    setPage(1);
    // bbox + nameFilter로 캐시 키 생성
    const cacheKey = `bbox_${region.latitude.toFixed(3)}_${region.longitude.toFixed(3)}_${region.latitudeDelta.toFixed(3)}_${region.longitudeDelta.toFixed(3)}_${nameFilter}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      setMuseums(cachedData);
      setDisplayedMuseums(cachedData.slice(0, 10));
      setHasMore(cachedData.length > 10);
      setLoadingMuseums(false);
      return;
    }
    // 지도 범위(bbox)로 쿼리 제한, 이름 필터 적용
    const bbox = getBoundingBox(region);
    const nameQuery = nameFilter ? `["name"~"${nameFilter}",i]` : '';
    const query = `
      [out:json][timeout:25];
      (
        nwr["tourism"~"museum|art_gallery"]${nameQuery}(${bbox.s},${bbox.w},${bbox.n},${bbox.e});
        nwr["historic"~"memorial|archaeological_site|monument|yes"]${nameQuery}(${bbox.s},${bbox.w},${bbox.n},${bbox.e});
      );
      out center tags 100;
    `;
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!response.ok) throw new Error('API 요청 실패');
      const json = await response.json();
      const uniqueMuseums = new Map<string, Museum>();
      (json.elements || []).forEach((el: any) => {
        if (!el.lat || !el.lon) return;
        const key = `${el.lat}_${el.lon}`;
        if (!uniqueMuseums.has(key)) {
          uniqueMuseums.set(key, {
            id: String(el.id),
            name: el.tags?.name || '이름 없음',
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || '',
          });
        }
      });
      const museums = Array.from(uniqueMuseums.values());
      // 결과가 없고, 확장 횟수가 3회 미만이면 bbox를 2배로 확장해서 재귀 호출
      if (museums.length === 0 && expandCount < 3) {
        const expandedRegion = {
          ...region,
          latitudeDelta: region.latitudeDelta * 2,
          longitudeDelta: region.longitudeDelta * 2,
        };
        fetchMuseumsInRegion(expandedRegion, nameFilter, expandCount + 1);
        return;
      }
      cacheData(cacheKey, museums);
      setMuseums(museums);
      setDisplayedMuseums(museums.slice(0, 10));
      setHasMore(museums.length > 10);
    } catch (e) {
      setMuseums([]);
      setDisplayedMuseums([]);
      setHasMore(false);
    } finally {
      setLoadingMuseums(false);
    }
  };

  // 지도 이동 시 박물관 검색 및 줌 레벨 업데이트
  const handleRegionChangeComplete = (reg: Region) => {
    setRegion(reg);
    const zl = getZoomLevel(reg.latitudeDelta);
    setZoomLevel(zl);
    // 이름 검색이 비어있을 때만 지도범위 검색
    if (zl >= 13 && searchText.trim() === '') {
      fetchMuseumsInRegion(reg);
    } else if (zl < 13) {
      setMuseums([]);
      setDisplayedMuseums([]);
    }
  };

  // 이름 검색 입력 시 지도범위 내에서만 검색
  useEffect(() => {
    if (searchText.trim() !== '') {
      fetchMuseumsInRegion(region, searchText.trim());
    } else {
      fetchMuseumsInRegion(region);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  // 더 많은 결과 로드
  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    const start = 0;
    const end = nextPage * 10;
    const newMuseums = museums.slice(start, end);
    
    setDisplayedMuseums(newMuseums);
    setPage(nextPage);
    setHasMore(end < museums.length);
    setLoadingMore(false);
  };

  // 박물관 마커 클릭 시 ticker 표시
  const handleMuseumMarkerPress = (museum: Museum) => {
    setTicker(museum.name);
    Animated.sequence([
      Animated.timing(tickerAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(tickerAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setTicker(null));
  };

  const handleZoom = (type: 'in' | 'out') => {
    setRegion(prev => {
      let newDelta = type === 'in'
        ? Math.max(prev.latitudeDelta / 2, MIN_DELTA)
        : Math.min(prev.latitudeDelta * 2, MAX_DELTA);
      return {
        ...prev,
        latitudeDelta: newDelta,
        longitudeDelta: newDelta,
      };
    });
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...region,
        latitudeDelta: type === 'in'
          ? Math.max(region.latitudeDelta / 2, MIN_DELTA)
          : Math.min(region.latitudeDelta * 2, MAX_DELTA),
        longitudeDelta: type === 'in'
          ? Math.max(region.longitudeDelta / 2, MIN_DELTA)
          : Math.min(region.longitudeDelta * 2, MAX_DELTA),
      }, 300);
    }
  };

  const moveToCurrentLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      }, 500);
    }
  };

  // 필터링된 장소 리스트 (displayedMuseums 사용)
  const filteredMuseums = displayedMuseums.filter(m =>
    m.name.toLowerCase().includes(searchText.trim().toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* 상단 검색창 */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="이름으로 검색..."
          value={searchText}
          onChangeText={setSearchText}
          clearButtonMode="while-editing"
        />
        {searchText.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchText('')}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        showsUserLocation={!!currentLocation}
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        minZoomLevel={1}
        maxZoomLevel={20}
      >
        <UrlTile
          urlTemplate={showLabels ? LABEL_TILE : NO_LABEL_TILE}
          maximumZ={19}
          flipY={false}
        />
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="현재 위치"
            description="여기에 있습니다."
            pinColor="blue"
            onPress={() => Alert.alert('현재 위치', '여기에 있습니다.')}
          />
        )}
        {filteredMuseums.map((museum) => (
          <Marker
            key={museum.id}
            coordinate={{ latitude: museum.lat, longitude: museum.lon }}
            pinColor="orange"
            title={museum.name}
            description={museum.address}
            onPress={() => handleMuseumMarkerPress(museum)}
          />
        ))}
      </MapView>
      <View style={styles.mapFabRoot}>
        <TouchableOpacity style={styles.locateBtn} onPress={moveToCurrentLocation}>
          <Text style={styles.emoji}>🧭</Text>
        </TouchableOpacity>
        <View style={styles.zoomGroup}>
          <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom('in')}>
            <Text style={styles.emoji}>➕</Text>
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity style={styles.zoomBtn} onPress={() => handleZoom('out')}>
            <Text style={styles.emoji}>➖</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.locateBtn} onPress={() => setShowLabels(v => !v)}>
          <Text style={styles.emoji}>{showLabels ? '👁️' : '🚫👁️'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.museumListContainer}>
        {loadingMuseums ? (
          <ActivityIndicator size="small" color="#007AFF" style={{ margin: 10 }} />
        ) : (
          filteredMuseums.length === 0 ? (
            <View style={styles.noResultContainer}>
              <Text style={styles.noResultText}>검색 결과가 없습니다.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredMuseums}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.museumList}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() => (
                loadingMore ? (
                  <ActivityIndicator size="small" color="#007AFF" style={{ margin: 10 }} />
                ) : hasMore ? (
                  <TouchableOpacity
                    style={[styles.museumItem, styles.loadMoreButton]}
                    onPress={loadMore}
                  >
                    <Text style={styles.loadMoreText}>더 보기</Text>
                  </TouchableOpacity>
                ) : null
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.museumItem}
                  onPress={() => {
                    if (mapRef.current) {
                      mapRef.current.animateToRegion({
                        latitude: item.lat,
                        longitude: item.lon,
                        latitudeDelta: region.latitudeDelta,
                        longitudeDelta: region.longitudeDelta,
                      }, 500);
                    }
                    handleMuseumMarkerPress(item);
                  }}
                >
                  <Text style={styles.museumName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )
        )}
      </View>
      <View style={styles.zoomInfo}>
        <Text style={styles.zoomText}>줌 레벨: {zoomLevel}</Text>
      </View>
      {filteredMuseums.length > 0 && (
        <View style={styles.listButtonContainer}>
          <TouchableOpacity style={styles.listButton} onPress={() => setShowList(true)}>
            <Text style={styles.listButtonText}>📋 목록보기</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal
        visible={showList}
        animationType="slide"
        transparent
        onRequestClose={() => setShowList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowList(false)}>
              <Text style={styles.closeButtonText}>⬇️ 닫기</Text>
            </TouchableOpacity>
            {loadingMuseums ? (
              <ActivityIndicator size="small" color="#007AFF" style={{ margin: 10 }} />
            ) : filteredMuseums.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#888', margin: 20 }}>검색 결과가 없습니다.</Text>
            ) : (
              <FlatList
                data={filteredMuseums}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalMuseumItem}
                    onPress={() => {
                      setShowList(false);
                      if (mapRef.current) {
                        mapRef.current.animateToRegion({
                          latitude: item.lat,
                          longitude: item.lon,
                          latitudeDelta: region.latitudeDelta,
                          longitudeDelta: region.longitudeDelta,
                        }, 500);
                      }
                    }}
                  >
                    <Text style={styles.modalMuseumName}>{item.name}</Text>
                    {item.address ? (
                      <Text style={styles.modalMuseumAddr}>{item.address}</Text>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
      {/* Ticker */}
      {ticker && (
        <Animated.View style={[styles.ticker, { opacity: tickerAnim, transform: [{ translateY: tickerAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }] }>
          <Text style={styles.tickerText}>{ticker}</Text>
          <TouchableOpacity
            style={styles.tickerIconBtn}
            onPress={() => {
              if (ticker) {
                const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticker)}`;
                setWebviewUrl(url);
              }
            }}
          >
            <Text style={styles.tickerIcon}>🗺️</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {/* WebView 모달 */}
      <Modal visible={!!webviewUrl} animationType="slide" onRequestClose={() => setWebviewUrl(null)}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.webviewClose} onPress={() => setWebviewUrl(null)}>
            <Text style={styles.webviewCloseText}>닫기</Text>
          </TouchableOpacity>
          {webviewUrl && (
            <WebView source={{ uri: webviewUrl }} style={{ flex: 1, marginTop: 60 }} />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  mapFabRoot: {
    position: 'absolute',
    right: 18,
    bottom: 110,
    alignItems: 'center',
    zIndex: 10,
  },
  locateBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  zoomGroup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 2,
    paddingHorizontal: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 14,
  },
  zoomBtn: {
    width: 52,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    width: 32,
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 2,
  },
  emoji: {
    fontSize: 28,
    textAlign: 'center',
  },
  museumListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: 'center',
  },
  museumList: {
    maxHeight: 60,
  },
  museumItem: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 6,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  museumName: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 15,
  },
  zoomInfo: {
    position: 'absolute',
    left: 18,
    bottom: 110,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  zoomText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 30,
    alignItems: 'center',
    zIndex: 20,
  },
  listButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  listButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 18,
    minHeight: 180,
    maxHeight: '60%',
  },
  closeButton: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalMuseumItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalMuseumName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  modalMuseumAddr: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  ticker: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tickerText: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 8,
  },
  tickerIconBtn: {
    padding: 4,
  },
  tickerIcon: {
    fontSize: 22,
  },
  webviewClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  webviewCloseText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchBarContainer: {
    position: 'absolute',
    top: 44,
    left: 18,
    right: 18,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  clearBtn: {
    marginLeft: 6,
    padding: 4,
  },
  clearBtnText: {
    fontSize: 18,
    color: '#888',
  },
  loadMoreButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  loadMoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  noResultContainer: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  noResultText: {
    color: '#888',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default MapScreen; 