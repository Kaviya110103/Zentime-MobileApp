import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { EmployeeContext } from '../context/EmployeeContext';

type LocationDto = {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  radius: number;
};

type Props = {
  onStatusChange?: (status: 'Active' | 'Inactive' | 'Unknown') => void;
  onAddressChange?: (address: string | null) => void;
  inModal?: boolean;
  showOnlyStatus?: boolean;
};

const LocationTest = ({
  onStatusChange,
  onAddressChange,
  inModal = false,
  showOnlyStatus = false,
}: Props) => {
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [status, setStatus] = useState<'Unknown' | 'Active' | 'Inactive'>('Unknown');
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [nearestLocation, setNearestLocation] = useState<LocationDto | null>(null);
   const { employee } = useContext(EmployeeContext);
   const companyCode = employee?.companyCode;
  const clientId = employee?.clientId;
  /* ---------- Fetch all geofences ---------- */

  useEffect(() => {
    const fetchLocations = async () => {
      if (!clientId) return;

      try {
        const res = await axios.get(`https://${companyCode}.zentime.co.in/api/locations`);
        setLocations(res.data);
      } catch (error) {
        console.error(error);
        Alert.alert('Unable to load locations for this client.');
      }
    };

    fetchLocations();
  }, [clientId]);

  /* ---------- Watch user location ---------- */
  useEffect(() => {
    if (locations.length === 0) return;

    let sub: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied for location');
          return;
        }

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 1,
          },
          async (loc) => {
            const coords = loc.coords;
            setUserLocation(coords);

            // Check distance to each geofence
            let found = false;
            let nearest: LocationDto | null = null;

            for (const loc of locations) {
              const d = getDistanceInMeters(
                coords.latitude,
                coords.longitude,
                loc.latitude,
                loc.longitude
              );
              if (d <= loc.radius) {
                found = true;
                nearest = loc;
                break;
              }
            }

            setStatus(found ? 'Active' : 'Inactive');
            setNearestLocation(nearest);
            onStatusChange?.(found ? 'Active' : 'Inactive');

            if (found && nearest) {
              setUserAddress(nearest.address);
              onAddressChange?.(nearest.address);
            } else {
              const rev = await Location.reverseGeocodeAsync(coords);
              if (rev.length > 0) {
                const a = rev[0];
                const formatted = `${a.name || ''}, ${a.street || ''}, ${(a as any).subLocality || ''}, ${a.city || ''}, ${a.region || ''} ${a.postalCode || ''}`;
                setUserAddress(formatted);
                onAddressChange?.(formatted);
              }
            }
          }
        );
      } catch (err) {
        console.error(err);
        Alert.alert('Location not available. Please try again.');
      }
    })();

    return () => sub?.remove();
  }, [locations]);

  /* ---------- Helpers ---------- */
  const getDistanceInMeters = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const toRad = (x: number) => (x * Math.PI) / 180;
      const R = 6371e3;
      const φ1 = toRad(lat1);
      const φ2 = toRad(lat2);
      const Δφ = toRad(lat2 - lat1);
      const Δλ = toRad(lon2 - lon1);

      const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const openDirections = () => {
    if (!nearestLocation) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${nearestLocation.latitude},${nearestLocation.longitude}`,
      android: `https://www.google.com/maps/dir/?api=1&destination=${nearestLocation.latitude},${nearestLocation.longitude}`,
    });
    Linking.openURL(url!);
  };

  /* ---------- Render ---------- */
  return (
    <View style={{ flex: 1 }}>
      {userLocation && locations.length > 0 && !showOnlyStatus && (
        <MapView
          style={inModal ? styles.modalMap : styles.map}
          provider={Platform.OS === 'android' ? 'google' : undefined}
          mapType="satellite"
          region={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
        >
          {locations.map((fence) => (
            <React.Fragment key={fence.id}>
              <Marker
                coordinate={fence}
                title={fence.name}
                description={fence.address}
              />
              <Circle
                center={fence}
                radius={fence.radius}
                strokeColor="rgba(0,255,0,0.8)"
                fillColor="rgba(0,255,0,0.3)"
              />
            </React.Fragment>
          ))}
        </MapView>
      )}

      <View style={styles.statusPanel}>
        <Text
          style={[
            styles.statusText,
            {
              color:
                status === 'Active'
                  ? 'green'
                  : status === 'Inactive'
                  ? 'red'
                  : 'black',
            },
          ]}
        >
          Status: {status}
        </Text>

        {showOnlyStatus && !userLocation && (
          <Text style={{ marginTop: 8, color: '#999' }}>Getting location...</Text>
        )}

        {status === 'Inactive' && !showOnlyStatus && nearestLocation && (
          <View style={{ marginTop: 10 }}>
            <Button title="Get Directions" onPress={openDirections} color="#007aff" />
          </View>
        )}

        {userAddress && (
          <Text style={styles.addressText}> {userAddress}{clientId}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '75%',
  },
  modalMap: {
    width: '100%',
    height: 250,
  },
  statusPanel: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  addressText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
  },
});

export default LocationTest;
