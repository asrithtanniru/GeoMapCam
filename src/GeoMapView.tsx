import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { usePermissions } from './PermissionHandler';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Camera: undefined;
  Map: undefined;
};

type GeoMapViewProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Map'>;
  route: RouteProp<RootStackParamList, 'Map'>;
};

interface PhotoLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface PhotoDimensions {
  width: number;
  height: number;
}

interface PhotoData {
  id: string;
  uri: string;
  location: PhotoLocation;
  dimensions: PhotoDimensions;
}

const GeoMapView: React.FC<GeoMapViewProps> = ({ navigation }) => {
  const { permissionsGranted, requestPermissions } = usePermissions();
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 20.5937,     // Default center of India
    longitude: 78.9629,
    latitudeDelta: 20,
    longitudeDelta: 20,
  });

  // Load photos from CameraRoll
  const loadPhotos = async (): Promise<void> => {
    if (!permissionsGranted) return;

    try {
      const { edges } = await CameraRoll.getPhotos({
        first: 50,
        assetType: 'Photos',
        groupName: 'GeoMapCamera',  // The album we saved photos to
        include: ['location', 'imageSize', 'filename'],
      });

      // Process photos to extract location data
      const processedPhotos: PhotoData[] = edges.map(({ node }) => {
        // Try to extract location from EXIF data
        const location = node.location || {};

        return {
          id: node.image.uri,
          uri: node.image.uri,
          location: {
            latitude: location.latitude || 0,
            longitude: location.longitude || 0,
            timestamp: Date.now(), // Use current timestamp as a fallback
          },
          dimensions: {
            width: node.image.width,
            height: node.image.height,
          },
        };
      }).filter(photo => photo.location.latitude !== 0 && photo.location.longitude !== 0);

      setPhotos(processedPhotos);

      // Update map region if we have photos with location
      if (processedPhotos.length > 0) {
        const lastPhoto = processedPhotos[0];
        setRegion({
          latitude: lastPhoto.location.latitude,
          longitude: lastPhoto.location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  useEffect(() => {
    if (permissionsGranted) {
      loadPhotos();
    }
  }, [permissionsGranted]);

  // If we don't have permissions
  if (!permissionsGranted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          Camera and location permissions are required to view the map.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}>
        {photos.map((photo) => (
          <Marker
            key={photo.id}
            coordinate={{
              latitude: photo.location.latitude,
              longitude: photo.location.longitude,
            }}
            onPress={() => setSelectedPhoto(photo)}>
            <Callout tooltip>
              <View style={styles.callout}>
                <Image source={{ uri: photo.uri }} style={styles.calloutImage} />
                <Text style={styles.calloutText}>
                  {new Date(photo.location.timestamp).toLocaleString()}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Photo thumbnails at bottom */}
      <View style={styles.photoStrip}>
        <FlatList
          horizontal
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSelectedPhoto(item);
                setRegion({
                  latitude: item.location.latitude,
                  longitude: item.location.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                });
              }}>
              <Image source={{ uri: item.uri }} style={styles.thumbnail} />
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Full photo view when selected */}
      {selectedPhoto && (
        <View style={styles.fullPhotoContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedPhoto(null)}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: selectedPhoto.uri }}
            style={styles.fullPhoto}
            resizeMode="contain"
          />
          <View style={styles.photoInfo}>
            <Text style={styles.photoInfoText}>
              Lat: {selectedPhoto.location.latitude.toFixed(6)}
            </Text>
            <Text style={styles.photoInfoText}>
              Long: {selectedPhoto.location.longitude.toFixed(6)}
            </Text>
            <Text style={styles.photoInfoText}>
              {new Date(selectedPhoto.location.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 1,
  },
  photoStrip: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  callout: {
    width: 200,
    height: 200,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  calloutImage: {
    width: '100%',
    height: 160,
  },
  calloutText: {
    padding: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  fullPhotoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhoto: {
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height / 2,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  photoInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
  },
  photoInfoText: {
    color: 'white',
    marginBottom: 5,
    textAlign: 'center',
  },
  permissionText: {
    color: 'black',
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
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default GeoMapView;
