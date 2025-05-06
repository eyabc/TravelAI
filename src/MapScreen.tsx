import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert, Platform, PermissionsAndroid, TouchableOpacity, Text, FlatList, ActivityIndicator } from 'react-native';
import MapView, { Marker, MapPressEvent, Region, UrlTile } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

const { width, height } = Dimensions.get('window');

const MIN_DELTA = 0.002;
const MAX_DELTA = 1.5;

interface MarkerData {
  latitude: number;
  longitude: number;
}

interface Museum {
  id: string;
  name: string;
  lat: number;
  lon: number;
  address?: string;
}

const MapScreen = () => {
  const [region, setRegion] = useState<Region>({
    latitude: 37.5665,
    longitude: 126.9780,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [currentLocation, setCurrentLocation] = useState<MarkerData | null>(null);
  const [museums, setMuseums] = useState<Museum[]>([]);
  const [loadingMuseums, setLoadingMuseums] = useState(false);
  const mapRef = useRef<MapView>(null);

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

  // 지도 이동 시 박물관 검색
  const handleRegionChangeComplete = (reg: Region) => {
    setRegion(reg);
    fetchMuseums(reg);
  };

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarkers(prev => [...prev, { latitude, longitude }]);
  };

  const handleMarkerPress = (marker: MarkerData, idx: number) => {
    Alert.alert('마커', `위도: ${marker.latitude}\n경도: ${marker.longitude}`);
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
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChangeComplete}
        minZoomLevel={1}
        maxZoomLevel={20}
      >
        <UrlTile
          urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="현재 위치"
            description="여기에 있습니다."
            pinColor="blue"
            onPress={() => handleMarkerPress(currentLocation, -1)}
          />
        )}
        {markers.map((marker, idx) => (
          <Marker
            key={idx}
            coordinate={marker}
            onPress={() => handleMarkerPress(marker, idx)}
          />
        ))}
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
      <View style={styles.zoomContainer}>
        <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom('in')}>
          <Text style={styles.zoomText}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom('out')}>
          <Text style={styles.zoomText}>－</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.locationButton} onPress={moveToCurrentLocation}>
          <Text style={styles.locationText}>내 위치</Text>
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
  zoomContainer: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    flexDirection: 'column',
    gap: 10,
    alignItems: 'center',
  },
  zoomButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  zoomText: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  locationButton: {
    width: 64,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  locationText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
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
});

export default MapScreen; 