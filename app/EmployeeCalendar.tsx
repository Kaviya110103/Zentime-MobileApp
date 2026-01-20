import { Calendar } from 'react-native-calendars';
import { 
  View, 
  Text, 
  Modal, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EmployeeContext } from '../context/EmployeeContext';
import BottomNavBar from '../components/BottomNavBar';

type AttendanceData = {
  date: string;
  attendanceStatus: string;
  dayStatus: string;
  timeIn: string;
  timeOut: string;
  imageInBase64?: string;
  imageOutBase64?: string;
  location?: string;
  timoutReason?: string;
  missedTimes?: number;
};

const { width } = Dimensions.get('window');

export default function EmployeeCalendar() {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
 const { employee } = useContext(EmployeeContext);
 const companyCode = employee?.companyCode;  // 👈 get companyCode here
  const employeeId = typeof employee?.id === 'number' ? employee.id : 0;
  useEffect(() => {
    const today = new Date();
    fetchMonthlyAttendance(today.getMonth() + 1, today.getFullYear());
  }, []);

  const fetchMonthlyAttendance = async (month: number, year: number) => {
    try {
      const url = `https://${companyCode}.zentime.co.in/api/attendance/monthly/${employeeId}/${year}/${String(month).padStart(2, '0')}`;
      const res = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = res.data;

      const marked: Record<string, any> = {};
      data.forEach((item: AttendanceData) => {
        const [dd, mm, yyyy] = item.date.split('/');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        let dotColor = '#757575'; // Default gray
        if (item.attendanceStatus === 'Present') dotColor = '#4CAF50';
        if (item.attendanceStatus === 'Absent') dotColor = '#F44336';
        if (item.attendanceStatus === 'Late') dotColor = '#FF9800';

        marked[formattedDate] = {
          marked: true,
          dotColor,
          selectedDotColor: '#FFFFFF',
          customStyles: {
            container: {
              backgroundColor: dotColor + '20', // Add opacity
              borderRadius: 8,
              padding: 4,
            },
            text: {
              color: '#1C1C1E',
              fontWeight: '600',
            }
          }
        };
      });

      setMarkedDates(marked);
    } catch (err) {
      console.error('Error fetching monthly attendance:', err);
      setMarkedDates({});
    }
  };

  const onDayPress = async (day: any) => {
    setSelectedDate(day.dateString);
    setLoading(true);
    const [yyyy, mm, dd] = day.dateString.split('-');
    const formatted = `${yyyy}-${mm}-${dd}`;

    try {
      const res = await axios.get(`https://${companyCode}.zentime.co.in/api/attendance/${employeeId}/${formatted}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setAttendanceData(res.data);
      setModalVisible(true);
    } catch (err) {
      console.error('Error fetching daily attendance:', err);
      setAttendanceData(null);
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return '#4CAF50';
      case 'Absent': return '#F44336';
      case 'Late': return '#FF9800';
      case 'Half Day': return '#FFC107';
      default: return '#757575';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
     <LinearGradient
                 colors={['#7726B9', '#5E1D9E']}
                 style={styles.header}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 0 }}
               >
                 <Text style={styles.headerTitle}>Leave & Permission Status</Text>
               </LinearGradient>

      <View style={styles.calendarWrapper}>
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={{
              ...markedDates,
              ...(selectedDate
                ? {
                    [selectedDate]: {
                      ...(markedDates[selectedDate] || {}),
                      selected: true,
                      selectedColor: '#007AFF',
                      customStyles: {
                        container: {
                          backgroundColor: '#007AFF20',
                          borderRadius: 8,
                          padding: 4,
                        },
                        text: {
                          color: '#007AFF',
                          fontWeight: 'bold',
                        }
                      }
                    },
                  }
                : {}),
            }}
            onDayPress={onDayPress}
            onMonthChange={(month) => fetchMonthlyAttendance(month.month, month.year)}
            theme={{
              backgroundColor: '#FFFFFF',
              calendarBackground: '#FFFFFF',
              textSectionTitleColor: '#6B7280',
              selectedDayBackgroundColor: '#007AFF',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#007AFF',
              dayTextColor: '#1F2937',
              textDisabledColor: '#D1D5DB',
              dotColor: '#007AFF',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#007AFF',
              disabledArrowColor: '#D1D5DB',
              monthTextColor: '#111827',
              indicatorColor: '#007AFF',
              textDayFontFamily: 'Inter-Medium',
              textMonthFontFamily: 'Inter-SemiBold',
              textDayHeaderFontFamily: 'Inter-SemiBold',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendar}
            markingType={'custom'}
            dayComponent={({date, state, marking}) => {
              return (
                <TouchableOpacity 
                  style={[
                    styles.dayContainer,
                    marking?.customStyles?.container,
                    state === 'today' && styles.todayContainer,
                    marking?.selected && styles.selectedDayContainer
                  ]}
                  onPress={() => onDayPress({dateString: date.dateString})}
                >
                  <Text style={[
                    styles.dayText,
                    state === 'disabled' && styles.disabledText,
                    marking?.customStyles?.text,
                    state === 'today' && !marking?.selected && styles.todayText,
                    marking?.selected && styles.selectedDayText
                  ]}>
                    {date.day}
                  </Text>
                  {marking?.marked && (
                    <View style={[
                      styles.dot,
                      {backgroundColor: marking.dotColor}
                    ]} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>

      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Attendance Details</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading attendance data...</Text>
              </View>
            ) : attendanceData ? (
              <>
                <View style={styles.dateHeader}>
                  <Feather name="calendar" size={20} color="#007AFF" />
                  <Text style={styles.dateText}>{formatDate(attendanceData.date)}</Text>
                </View>

                {/* Status Card */}
                <View style={[
                  styles.statusCard,
                  {backgroundColor: getStatusColor(attendanceData.attendanceStatus) + '20'}
                ]}>
                  <Text style={[
                    styles.statusText,
                    {color: getStatusColor(attendanceData.attendanceStatus)}
                  ]}>
                    {attendanceData.attendanceStatus}
                  </Text>
                  {attendanceData.dayStatus && (
                    <Text style={styles.dayStatusText}>• {attendanceData.dayStatus}</Text>
                  )}
                </View>

                {/* Time Details */}
                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Feather name="clock" size={18} color="#6B7280" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Time In</Text>
                      <Text style={styles.detailValue}>{formatTime(attendanceData.timeIn)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Feather name="clock" size={18} color="#6B7280" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Time Out</Text>
                      <Text style={styles.detailValue}>{formatTime(attendanceData.timeOut)}</Text>
                    </View>
                  </View>
                  
                  {attendanceData.location && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Feather name="map-pin" size={18} color="#6B7280" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Location</Text>
                        <Text style={styles.detailValue}>{attendanceData.location}</Text>
                      </View>
                    </View>
                  )}
                  
                  {attendanceData.missedTimes != null && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Feather name="alert-circle" size={18} color="#F44336" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Missed Time</Text>
                        <Text style={[styles.detailValue, {color: '#F44336'}]}>
                          {attendanceData.missedTimes} minutes
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Images Section */}
                {(attendanceData.imageInBase64 || attendanceData.imageOutBase64) && (
                  <View style={styles.imagesSection}>
                    <Text style={styles.sectionTitle}>Check-in Photos</Text>
                    <View style={styles.imageRow}>
                      {attendanceData.imageInBase64 && (
                        <View style={styles.imageContainer}>
                          <Image 
                            source={{ uri: `data:image/jpeg;base64,${attendanceData.imageInBase64}` }} 
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      
                      {attendanceData.imageOutBase64 && (
                        <View style={styles.imageContainer}>
                          <Image 
                            source={{ uri: `data:image/jpeg;base64,${attendanceData.imageOutBase64}` }} 
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No attendance record found for this date</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
                <BottomNavBar activeTab="" />
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  headerTitle: {
    paddingTop: 13,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  calendarWrapper: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    padding: 12,
  },
  calendar: {
    borderRadius: 12,
  },
  dayContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 2,
  },
  dayText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  disabledText: {
    color: '#D1D5DB',
  },
  todayContainer: {
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  todayText: {
    color: '#007AFF',
  },
  selectedDayContainer: {
    backgroundColor: '#007AFF',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  dot: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  dayStatusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  imagesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 16,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noDataText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
});