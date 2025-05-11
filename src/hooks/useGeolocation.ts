import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

interface UseGeolocationResult {
  location: Location | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<void>;
}

/**
 * 위치 정보 접근을 위한 훅
 * @param enableHighAccuracy 고정밀 위치 사용 여부
 * @param timeout 타임아웃(ms)
 * @param maximumAge 최대 캐시 시간(ms)
 * @returns 위치 관련 상태 및 함수
 */
export function useGeolocation(
  enableHighAccuracy = true,
  timeout = 15000,
  maximumAge = 10000
): UseGeolocationResult {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 위치 권한 요청
  const requestPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        // iOS는 기본적으로 시스템 팝업을 통해 관리
        return true;
      } else if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '위치 권한 요청',
            message: '현재 위치를 사용하려면 위치 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '거부',
            buttonPositive: '허용',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return false;
    } catch (err) {
      console.error('권한 요청 오류:', err);
      setError('위치 권한 요청 중 오류가 발생했습니다.');
      return false;
    }
  };
  
  // 현재 위치 가져오기
  const getCurrentLocation = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        setError('위치 권한이 필요합니다.');
        setLoading(false);
        return;
      }
      
      Geolocation.getCurrentPosition(
        position => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? undefined,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
            timestamp: position.timestamp
          });
          setLoading(false);
        },
        error => {
          setError(error.message);
          setLoading(false);
        },
        { enableHighAccuracy, timeout, maximumAge }
      );
    } catch (err) {
      console.error('위치 가져오기 오류:', err);
      setError('위치 정보를 가져오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 위치 정보 가져오기
  useEffect(() => {
    getCurrentLocation();
    
    // 위치 업데이트 구독 (옵션)
    // const watchId = Geolocation.watchPosition(
    //   (position) => {
    //     setLocation({
    //       latitude: position.coords.latitude,
    //       longitude: position.coords.longitude,
    //       accuracy: position.coords.accuracy,
    //       altitude: position.coords.altitude,
    //       heading: position.coords.heading,
    //       speed: position.coords.speed,
    //       timestamp: position.timestamp
    //     });
    //     setLoading(false);
    //   },
    //   (error) => {
    //     setError(error.message);
    //     setLoading(false);
    //   },
    //   { enableHighAccuracy, distanceFilter: 10 }
    // );
    
    // return () => {
    //   Geolocation.clearWatch(watchId);
    // };
  }, []);
  
  return {
    location,
    loading,
    error,
    requestPermission,
    getCurrentLocation
  };
} 