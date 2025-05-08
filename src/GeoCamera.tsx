import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import Geolocation from 'react-native-geolocation-service';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { usePermissions } from './PermissionHandler';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  date: string;
}

interface CapturedImageData {
  uri: string;
  location: LocationData;
}

const GeoCamera: React.FC = () => {
  const cameraRef = useRef<Camera>(null);
  const [capturedImage, setCapturedImage] = useState<CapturedImageData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const { hasPermission, requestPermission } = useCameraPermission();
  const { permissionsGranted, requestPermissions } = usePermissions();
  const devices = useCameraDevices();
  const device = devices?.find((d) => d.position === cameraPosition); // 'back' or 'front'
  
  // Find the best format that supports photo mode
  const format = device?.formats.find(f => f.photoWidth && f.photoHeight) || device?.formats[0];

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    requestPermissions(); // ensure both camera + location permissions are requested
  }, []);

  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const timestamp = position.timestamp;
          resolve({
            latitude,
            longitude,
            timestamp,
            date: new Date(timestamp).toLocaleString(),
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Don't reject, return a default location instead
          resolve({
            latitude: 0,
            longitude: 0,
            timestamp: Date.now(),
            date: new Date().toLocaleString(),
          });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const takePhoto = async (): Promise<void> => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        alert('Camera permission is required to take photos');
        return;
      }
    }

    if (!cameraRef.current || isCapturing) {
      return;
    }

    // Clear previous errors
    setCameraError(null);
    
    setIsCapturing(true);
    try {
      // Get location first
      const locationData = await getCurrentLocation();
      setLocation(locationData);

      // Take photo with error handling
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        qualityPrioritization: 'quality',
      });

      if (!photo || !photo.path) {
        throw new Error('Failed to capture photo');
      }

      const filePath = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;

      // Save to camera roll with error handling
      try {
        await CameraRoll.save(filePath, {
          type: 'photo',
          album: 'GeoMapCamera',
        });
      } catch (saveError) {
        console.error('Error saving to camera roll:', saveError);
        // Continue even if save fails
      }

      setCapturedImage({
        uri: filePath,
        location: locationData,
      });
    } catch (error) {
      console.error('Error taking photo:', error);
      setCameraError('Failed to take photo. Please try again.');
      alert('Failed to take photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCameraType = (): void => {
    setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const retakePhoto = (): void => {
    setCapturedImage(null);
  };

  const renderLocationOverlay = (): React.ReactNode => {
    if (!location) return null;

    const { latitude, longitude, date } = location;

    return (
      <View style={styles.locationOverlay}>
        <Text style={styles.locationText}>
          Lat: {latitude.toFixed(6)} Long: {longitude.toFixed(6)}
        </Text>
        <Text style={styles.locationText}>{date}</Text>
      </View>
    );
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera and location permissions are required.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: capturedImage.uri }}
          style={styles.preview}
          resizeMode="cover"
        />
        {renderLocationOverlay()}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={retakePhoto}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  // Handle the case where we have device but no suitable format
  if (!format) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          No suitable camera format found. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        enableZoomGesture={true}
        isMirrored={cameraPosition === 'front'}
        format={format}
        onError={(error) => {
          console.error('Camera error:', error);
          setCameraError(error.message);
        }}
      />
      {renderLocationOverlay()}
      {cameraError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{cameraError}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePhoto}
          disabled={isCapturing}>
          {isCapturing ? (
            <ActivityIndicator size="large" color="#FFF" />
          ) : (
            <View style={styles.captureCircle} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  preview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  flipButton: {
    position: 'absolute',
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  locationOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    alignItems: 'center',
  },
  locationText: {
    color: 'white',
    fontSize: 12,
  },
  buttonRow: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
  },
  permissionText: {
    color: 'white',
    textAlign: 'center',
    padding: 20,
  },
  permissionButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    margin: 20,
    alignItems: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default GeoCamera;
function alert(arg0: string) {
  throw new Error('Function not implemented.');
}

