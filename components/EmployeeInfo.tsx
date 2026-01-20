// import { Feather } from '@expo/vector-icons';
// import axios from 'axios';
// import { useRouter } from 'expo-router';
// import React, { ReactNode, useEffect, useState } from 'react';
// import {
//   ActivityIndicator,
//   Image,
//   Pressable,
//   StyleSheet,
//   Text,
//   View,
// } from 'react-native';
// import * as Notifications from 'expo-notifications';
// import { useNotificationSetup } from '../useNotificationSetup'; // ✅ make sure the path is correct

// interface Employee {
//   position: ReactNode;
//   id: number;
//   username: string;
//   profileImage?: string;
// }

// type EmployeeInfoProps = {
//   employeeId: string;
// };

// const EmployeeInfo: React.FC<EmployeeInfoProps> = ({ employeeId }) => {
//   const [employee, setEmployee] = useState<Employee | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [currentTime, setCurrentTime] = useState<string>('');
//   const [currentDate, setCurrentDate] = useState<string>('');
//   const [formattedDate, setFormattedDate] = useState<string>('');
//   const [attendanceStatus, setAttendanceStatus] = useState<string>('');
//   const [showNotification, setShowNotification] = useState<boolean>(false);
//   const router = useRouter();

// const expoPushToken = useNotificationSetup(); // ✅ gets the token

//   const showNotificationLocal = async (title: string, message: string) => {
//     await Notifications.scheduleNotificationAsync({
//       content: { title, body: message },
//       trigger: null,
//     });
//   };
// const sendPushNotification = async (title: string, message: string) => {
//   if (!expoPushToken) {
//     console.log('Expo Push Token not ready');
//     return;
//   }

//   await fetch('https://exp.host/--/api/v2/push/send', {
//     method: 'POST',
//     headers: {
//       Accept: 'application/json',
//       'Accept-encoding': 'gzip, deflate',
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       to: expoPushToken,
//       title,
//       body: message,
//       sound: 'default',
//     }),
//   });
// };
// useEffect(() => {
//   const subscription = Notifications.addNotificationResponseReceivedListener(response => {
//     console.log('🔔 Notification tapped:', response);
//     // Optional: router.push('/MarkAttendance')
//   });

//   return () => subscription.remove();
// }, []);

//   useEffect(() => {
//     const fetchEmployee = async () => {
//       try {
//         const res = await axios.get<Employee>(
//           `https://${companyCode}.zentime.co.in/api/employees/${employeeId}`
//         );
//         setEmployee(res.data);
//       } catch (err) {
//         console.error('Failed to load employee:', err);
//         setEmployee(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (employeeId) fetchEmployee();
//   }, [employeeId]);

//   useEffect(() => {
//     const updateTime = () => {
//       const now = new Date();
//       const timeStr = now.toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       });
//       const dateStr = now.toLocaleDateString(undefined, {
//         weekday: 'long',
//         day: '2-digit',
//         month: 'long',
//         year: 'numeric',
//       });

//       const dd = String(now.getDate()).padStart(2, '0');
//       const mm = String(now.getMonth() + 1).padStart(2, '0');
//       const yyyy = now.getFullYear();
//       const formatted = `${dd}/${mm}/${yyyy}`;

//       setCurrentTime(timeStr);
//       setCurrentDate(dateStr);
//       setFormattedDate(formatted);
//     };

//     updateTime();
//     const interval = setInterval(updateTime, 1000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     const checkAttendanceStatus = async () => {
//       try {
//         const response = await axios.get(
//           `https://${companyCode}.zentime.co.in/api/attendance-records/check-today-attendance?employeeId=${employeeId}`
//         );
//         const status = response.data;
//         setAttendanceStatus(status);
//         setShowNotification(status !== "Attendance complete for today.");

//         if (status.includes("Time-Out not posted")) {
//           await showNotificationLocal("Time-Out Reminder", "Please complete your Time-Out for today!");
//         }
//       } catch (error) {
//         console.error('Error checking attendance:', error);
//         setAttendanceStatus('Error checking attendance');
//         setShowNotification(true);
//         await showNotificationLocal("Error", "Failed to check attendance status.");
//       }
//     };

//     checkAttendanceStatus();
//     const interval = setInterval(checkAttendanceStatus, 300000);
//     return () => clearInterval(interval);
//   }, [employeeId]);

// const handleBellPress = async () => {
//   try {
//     const response = await axios.get(
//       `https://${companyCode}.zentime.co.in/api/attendance-records/check-today-attendance?employeeId=${employeeId}`
//     );
//     const status = response.data;

//     if (status === "Attendance complete for today.") {
//       await showNotificationLocal("Attendance", "Your attendance is complete for today.");
//       await sendPushNotification("Attendance", "Your attendance is complete for today.");
//       setShowNotification(false);
//     } else {
//       await showNotificationLocal("Incomplete Attendance", status);
//       await sendPushNotification("Time-Out Reminder", status);
//       setShowNotification(true);
//     }
//   } catch (error) {
//     console.error('Error checking attendance:', error);
//     await showNotificationLocal("Error", "Failed to check attendance status");
//     await sendPushNotification("Error", "Failed to check attendance status");
//   }
// };

//   if (loading) return <ActivityIndicator size="large" color="blue" />;
//   if (!employee) return <Text style={styles.noData}>No employee data found.</Text>;

//   const profileImageSource = employee.profileImage
//     ? { uri: employee.profileImage }
//     : require('../assets/images/empimage.jpg');

//   return (
//     <Pressable onPress={() => router.push('/EmployeeProfile')}>
//       <View style={styles.employeeContainer}>
//         <View style={styles.employeeInfo}>
//           <Image source={profileImageSource} style={styles.profileImage} />
//           <View style={styles.employeeText}>
//             <Text style={styles.employeeName}>{employee.username}</Text>
//             <Text style={styles.employeeTitle}>{employee.position}</Text>
//           </View>
//           <Pressable onPress={handleBellPress}>
//             <View style={styles.bellWrapper}>
//               <Feather name="bell" size={24} color="white" />
//               {showNotification && <View style={styles.greenDot} />}
//             </View>
//           </Pressable>
//         </View>
//         <View style={styles.dateTime}>
//           <Text style={styles.time}>{currentTime}</Text>
//           <Text style={styles.date}>{currentDate}</Text>
//         </View>
//       </View>
//     </Pressable>
//   );
// };

// const styles = StyleSheet.create({
//   employeeContainer: { padding: 10 },
//   employeeInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'transparent',
//     padding: 10,
//     borderRadius: 8,
//   },
//   profileImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 10,
//     backgroundColor: '#fff',
//     borderWidth: 2,
//     borderColor: '#ffffff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//     overflow: 'hidden',
//   },
//   employeeText: { flex: 1 },
//   employeeName: { fontWeight: 'bold', fontSize: 18, color: 'white' },
//   employeeTitle: { fontSize: 14, color: 'white', fontWeight: '400' },
//   bellWrapper: { position: 'relative', padding: 5 },
//   greenDot: {
//     position: 'absolute',
//     top: 2,
//     right: 2,
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     backgroundColor: 'limegreen',
//   },
//   dateTime: { marginTop: 10, alignItems: 'center', backgroundColor: 'transparent' },
//   time: { fontSize: 24, fontWeight: 'bold', color: 'white' },
//   date: { fontSize: 15, color: 'white' },
//   noData: { textAlign: 'center', color: 'gray' },
// });

// export default EmployeeInfo;


import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { EmployeeContext } from '../context/EmployeeContext';

interface Employee {
  position: ReactNode;
  id: number;
  username: string;
  profileImage?: string;
  
}

type EmployeeInfoProps = {
  employeeId: string;
};

const EmployeeInfo: React.FC<EmployeeInfoProps> = ({ employeeId }) => {
  const [employees, setEmployees] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [attendanceStatus, setAttendanceStatus] = useState<string>('');
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const router = useRouter();
  const {  employee, setEmployee } = useContext(EmployeeContext);
  const companyCode = employee?.companyCode;
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await axios.get<Employee>(
          `https://${companyCode}.zentime.co.in/api/employees/${employeeId}`
        );
        setEmployees(res.data);
      } catch (err) {
        console.error('Failed to load employee:', err);
        setEmployees(null);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) fetchEmployee();
  }, [employeeId]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = now.toLocaleDateString(undefined, {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      // Format for backend API: dd/MM/yyyy
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const formatted = `${dd}/${mm}/${yyyy}`;

      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
      setFormattedDate(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkAttendanceStatus = async () => {
      try {
        const response = await axios.get(
          `https://${companyCode}.zentime.co.in/api/attendance-records/check-today-attendance?employeeId=${employeeId}`
        );
        const status = response.data;
        setAttendanceStatus(status);
        
        // Show notification dot if attendance is not complete
        setShowNotification(status !== "Attendance complete for today.");
      } catch (error) {
        console.error('Error checking attendance:', error);
        setAttendanceStatus('Error checking attendance');
        setShowNotification(true);
      }
    };

    // Check every 5 minutes (300000 ms)
    checkAttendanceStatus();
    const interval = setInterval(checkAttendanceStatus, 300000);
    return () => clearInterval(interval);
  }, [employeeId]);

  const handleBellPress = async () => {
    try {
      const response = await axios.get(
        `https://${companyCode}.zentime.co.in/api/attendance-records/check-today-attendance?employeeId=${employeeId}`
      );
      const status = response.data;
      
      if (status === "Attendance complete for today.") {
        Alert.alert('Attendance Status', 'Your attendance is complete for today!');
        setShowNotification(false);
      } else {
        Alert.alert('Attendance Status', status);
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
      Alert.alert('Error', 'Failed to check attendance status');
    }
  };

  if (loading) return <ActivityIndicator size="large" color="blue" />;
  if (!employees)
    return <Text style={styles.noData}>No employee data found.</Text>;

  const profileImageSource = employees.profileImage
    ? { uri: employees.profileImage }
    : require('../assets/images/empimage.jpg');

  return (
    <Pressable onPress={() => router.push('/EmployeeProfile')}>
      <View style={styles.employeeContainer}>
        <View style={styles.employeeInfo}>
          <Image source={profileImageSource} style={styles.profileImage} />
          <View style={styles.employeeText}>
            <Text style={styles.employeeName}>{employees.username}</Text>
            <Text style={styles.employeeTitle}>{employees.position}</Text>
          </View>
          <Pressable onPress={handleBellPress}>
            <View style={styles.bellWrapper}>
              <Feather name="bell" size={24} color="white" />
              {showNotification && (
                <View style={styles.greenDot} />
              )}
            </View>
          </Pressable>
        </View>

        <View style={styles.dateTime}>
          <Text style={styles.time}>{currentTime}</Text>
          <Text style={styles.date}>{currentDate}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  employeeContainer: {
    padding: 10,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 10,
    borderRadius: 8,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  employeeText: {
    flex: 1,
  },
  employeeName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'white',
  },
  employeeTitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: '400',
  },
  bellWrapper: {
    position: 'relative',
    padding: 5,
  },
  greenDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'limegreen',
  },
  dateTime: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  time: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  date: {
    fontSize: 15,
    color: 'white',
  },
  noData: {
    textAlign: 'center',
    color: 'gray',
  },
});

export default EmployeeInfo;