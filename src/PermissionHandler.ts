import { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission, PermissionStatus } from 'react-native-permissions';

interface PermissionsHook {
  permissionsGranted: boolean;
  requestPermissions: () => Promise<boolean>;
}

export const usePermissions = (): PermissionsHook => {
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false);

  const requestPermissions = async (): Promise<boolean> => {
    try {
      // Define needed permissions based on platform
      const cameraPermission: Permission | undefined = Platform.select({
        android: PERMISSIONS.ANDROID.CAMERA,
        ios: PERMISSIONS.IOS.CAMERA,
        default: undefined,
      });
      
      const locationPermission: Permission | undefined = Platform.select({
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        default: undefined,
      });
      
      if (!cameraPermission || !locationPermission) {
        console.error('Permissions not defined for this platform');
        return false;
      }

      // Check existing permissions first
      const cameraStatus: PermissionStatus = await check(cameraPermission);
      const locationStatus: PermissionStatus = await check(locationPermission);
      
      // Request permissions if needed
      let finalCameraStatus: PermissionStatus = cameraStatus;
      let finalLocationStatus: PermissionStatus = locationStatus;
      
      if (cameraStatus !== RESULTS.GRANTED) {
        finalCameraStatus = await request(cameraPermission);
      }
      
      if (locationStatus !== RESULTS.GRANTED) {
        finalLocationStatus = await request(locationPermission);
      }
      
      // Update state based on permission results
      const allGranted: boolean = 
        finalCameraStatus === RESULTS.GRANTED && 
        finalLocationStatus === RESULTS.GRANTED;
      
      setPermissionsGranted(allGranted);
      
      if (!allGranted) {
        Alert.alert(
          'Permissions Required',
          'Camera and location permissions are required to use all features of this app.',
          [{ text: 'OK' }]
        );
      }
      
      return allGranted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  return { permissionsGranted, requestPermissions };
};
