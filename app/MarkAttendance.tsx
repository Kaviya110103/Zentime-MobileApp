import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
  Entypo,
  MaterialIcons,
} from '@expo/vector-icons';

import AttendanceActivity from '../components/AttendanceActivity';
import EmployeeInfo from '../components/EmployeeInfo';
import Clockrow from '../components/ClockRow';
import Testback from '../components/Testback';
import { EmployeeContext } from '../context/EmployeeContext';
import LocationTest from './LocationTest';
import BottomNavBar from '../components/BottomNavBar';
import { router } from 'expo-router';

const MarkAttendance = () => {
  const [activeTab, setActiveTab] = useState('Home');

  const {  employee, setEmployee } = useContext(EmployeeContext);
  const companyCode = employee?.companyCode;
  const employeeId = employee?.id;
  const [currentAddress, setCurrentAddress] = useState('');

  useEffect(() => {
    if (!employeeId) {
      router.replace('/EmployeeLogin');
    }
  }, [employeeId]);

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container} scrollEnabled={false}>
        <ImageBackground
          source={require('../assets/images/bg.png')}
          style={styles.timeCard}
          imageStyle={{ borderRadius: 0 }}
        >
          <View style={styles.Empinfo}>
            <EmployeeInfo employeeId={employeeId} />
          </View>

          <View>
            {employeeId ? (
              <Testback />
            ) : (
              <Text style={{ color: 'red' }}>Employee not logged in</Text>
            )}
          </View>

          <Text style={styles.location}>
            <Entypo name="location-pin" size={14} color="#555" />
            {' '}
            {currentAddress ? currentAddress : 'Detecting location...'}
          </Text>

          <Clockrow employeeId={employeeId} />

          <View style={styles.botoombox}>
            <View style={styles.gridIcons}>
              {[
                [MaterialIcons, 'house-siding', 'Status', '#FF6B6B'],
                [Feather, 'calendar', 'SwapSchedule', '#4ECDC4'],
                [MaterialIcons, 'speed', 'Announcement', '#45B7D1'],
                [MaterialCommunityIcons, 'file-document-outline', 'Report', '#A78BFA'],
              ].map(([Icon, iconName, label, iconColor], index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.iconItem}
                  onPress={() => {
                    if (label === 'SwapSchedule') {
                      router.push({
                        pathname: '/EmployeeCalendar',
                        params: { employeeId: employeeId.toString() }  //https://${companyCode}.zentime.co.in    http://192.168.1.16:8080
                      });
                    } else if (label === 'Status') {
                      router.push({
                        pathname: '/EmployeeLeavePermission',
                        params: { employeeId: String(employeeId) },
                      });
                    } else if (label === 'Report') {
                      router.push({
                        pathname: '/Calendarprinting',
                        params: { employeeId: employeeId.toString() }
                      });
                    } else if (label === 'Announcement') {
                      router.push('/AllAnnouncements');
                    } else {
                      console.log(label + ' pressed');
                    }
                  }}
                >
                  <View style={styles.container}>
                    {React.createElement(Icon as React.ComponentType<any>, {
                      name: iconName,
                      size: 28,
                      color: iconColor,
                      style: { marginLeft: 18 },
                    })}
                  </View>
                  <Text style={styles.iconLabel}>{typeof label === 'string' ? label : ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView   contentContainerStyle={styles.container}>
            <AttendanceActivity employeeId={employeeId} />
            </ScrollView>
          </View>
        </ImageBackground>
      </ScrollView>

        <View style={styles.textlocation}>
          <LocationTest
            onAddressChange={setCurrentAddress}
            showOnlyStatus={true}
            inModal={false}
          />
        </View>
      <BottomNavBar activeTab="Home" />
    </View>
  );
};

export default MarkAttendance;

const styles = StyleSheet.create({
  mainContainer: {
    marginTop: 0,
    flex: 1,
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
  },
  container: {
    display: 'flex',
    marginTop: 0,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  timeCard: {
    borderRadius: 0,
    marginBottom: 18,
    width: '100%',
    overflow: 'hidden',
  },
  location: {
    textAlign: 'center',
    marginVertical: 8,
    color: 'white',
    fontSize: 10,
  },
  Empinfo: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  clockSection: {
    marginBottom: 16,
  },
  clockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  clockInfo: {
    flex: 1,
    marginLeft: 10,
  },
  clockTitle: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  clockTime: {
    alignItems: 'flex-end',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    marginTop: 12,
  },
  navItem: {
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 10,
    color: '#333',
  },
  activeNavLabel: {
    color: 'redorange',
    fontWeight: 'bold',
  },
  gridIcons: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    borderBlockColor: 'blue',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    height: 100,
  },
  textlocation: {
    display: 'none',
  },
  iconItem: {
    width: '24%',
    alignItems: 'center',
    marginBottom: 12,
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'white',
    padding: 8,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  iconLabel: {
    fontSize: 10,
    color: '#333',
    marginTop: 4,
  },
  botoombox: {
    backgroundColor: 'white',
    paddingVertical: 18,
    borderRadius: 20,
    minHeight: 500,
  },
});
