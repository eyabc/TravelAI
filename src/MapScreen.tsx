import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert, Platform, PermissionsAndroid, TouchableOpacity, Text, FlatList, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region, UrlTile } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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

const MapScreen = () => {
  const [region, setRegion] = useState<Region>({
    latitude: 37.5665,
    longitude: 126.9780,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [museums, setMuseums] = useState<Museum[]>([]);
  const [loadingMuseums, setLoadingMuseums] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const mapRef = useRef<MapView>(null);
  const [currentScale, setCurrentScale] = useState(region.latitudeDelta);

  // latitudeDelta -> zoom level 변환 함수
  const getZoomLevel = (latDelta: number) => {
    // 구글/OSM 기준 대략적 변환 공식
    return Math.round(Math.log2(360 / latDelta));
  };
  const [zoomLevel, setZoomLevel] = useState(getZoomLevel(region.latitudeDelta));

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

  // Overpass API로 박물관 검색
  const fetchMuseums = async (region: Region) => {
    setLoadingMuseums(true);
    const bbox = getBoundingBox(region);
    const query = `
      [out:json][timeout:25];
      (
        node["tourism"="museum"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});
        way["tourism"="museum"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});
        relation["tourism"="museum"](${bbox.s},${bbox.w},${bbox.n},${bbox.e});
      );
      out center tags;
    `;
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      const json = await response.json();
      const museums: Museum[] = (json.elements || []).map((el: any) => ({
        id: String(el.id),
        name: el.tags?.name || '이름 없음',
        lat: el.lat || el.center?.lat,
        lon: el.lon || el.center?.lon,
        address: el.tags?.['addr:full'] || el.tags?.['addr:street'] || '',
      })).filter((m: Museum) => m.lat && m.lon);
      setMuseums(museums);
    } catch (e) {
      setMuseums([]);
    } finally {
      setLoadingMuseums(false);
    }
  };

  // 지도 이동 시 박물관 검색 및 줌 레벨 업데이트
  const handleRegionChangeComplete = (reg: Region) => {
    setRegion(reg);
    const zl = getZoomLevel(reg.latitudeDelta);
    setZoomLevel(zl);
    if (zl >= 13) {
      fetchMuseums(reg);
    } else {
      setMuseums([]); // 줌 레벨이 낮으면 박물관 마커/리스트 모두 숨김
    }
  };

  const handleMuseumMarkerPress = (museum: Museum) => {
    Alert.alert(museum.name, museum.address || '');
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

  return (
    <View style={styles.container}>
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
        {museums.map((museum) => (
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
          <FlatList
            data={museums}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.museumList}
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
        )}
      </View>
      <View style={styles.zoomInfo}>
        <Text style={styles.zoomText}>줌 레벨: {zoomLevel}</Text>
      </View>
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
});

export default MapScreen; 