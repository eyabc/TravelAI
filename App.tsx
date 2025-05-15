/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useRef, useEffect} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  Dimensions
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from './src/MapScreen';

const { width, height } = Dimensions.get('window');
const Stack = createNativeStackNavigator();

function LoginScreen({ navigation }: any): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 12000,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -width * 0.05,
          duration: 12000,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -height * 0.05,
          duration: 12000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim, translateX, translateY]);

  const handleLogin = () => {
    navigation.replace('Map');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill}>
        <Animated.Image
          source={require('./assets/bg-travel.jpg')}
          style={[
            styles.bgImage,
            {
              transform: [
                { scale: scaleAnim },
                { translateX: translateX },
                { translateY: translateY },
              ],
            },
          ]}
          resizeMode="cover"
          blurRadius={1}
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <View style={styles.loginContainer}>
          <Text style={styles.title}>TravelAI</Text>
          <Text style={styles.subtitle}>당신의 여행 파트너</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>지도 모드</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.signupButton}>
            <Text style={styles.signupButtonText}>계정이 없으신가요? 회원가입</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  bgImage: {
    width: width * 1.1,
    height: height * 1.1,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loginContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signupButton: {
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

