// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import GeoCamera from './src/GeoCamera';
import GeoMapView from './src/GeoMapView';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName = '';

              if (route.name === 'Camera') {
                iconName = 'camera-alt';
              } else if (route.name === 'Map') {
                iconName = 'map';
              }

              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007BFF',
            tabBarInactiveTintColor: 'gray',
            headerShown: true,
          })}>
          <Tab.Screen 
            name="Camera" 
            component={GeoCamera} 
            options={{
              title: 'Geo Camera',
            }}
          />
          <Tab.Screen 
            name="Map" 
            component={GeoMapView} 
            options={{
              title: 'Photo Map',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
