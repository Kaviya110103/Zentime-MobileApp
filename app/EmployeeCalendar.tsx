import { Calendar, DateData } from 'react-native-calendars';
import { 
  View, 
  Text, 
  Modal, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from "expo-router";
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { EmployeeContext } from '../context/EmployeeContext';
import BottomNavBar from '../components/BottomNavBar';
import { buildApiUrl, withClientId } from '../lib/api';

type AttendanceData = {
  date: string;
  attendanceStatus: string;
  dayStatus?: string;
  timeIn?: string;
  timeOut?: string;
  imageInBase64?: string;
  imageOutBase64?: string;
  location?: string;
  timoutReason?: string;
  missedTimes?: number;
};

type Holiday = {
  id: number;
  clientId: number;
  holidayDate: string;
  holidayName: string;
  holidayType: string;
};

type MarkedDate = {
  marked?: boolean;
  dotColor?: string;
  selectedDotColor?: string;
  selected?: boolean;
  selectedColor?: string;
  dots?: { key: string; color: string }[];
  customStyles?: {
    container?: object;
    text?: object;
  };
};

type MarkedDates = {
  [date: string]: MarkedDate;
};

const { width } = Dimensions.get('window');

export default function EmployeeCalendar() {
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const { employee } = useContext(EmployeeContext);
  const companyCode = employee?.companyCode;
  const clientId = employee?.clientId;
  const employeeId = typeof employee?.id === 'number' ? employee.id : 0;
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);
  
  const [isEmployeeReady, setIsEmployeeReady] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const normalizeHolidayDate = (raw?: string) => {
    if (!raw) return "";
    return raw.includes("T") ? raw.split("T")[0] : raw;
  };

  const fetchHolidays = async () => {
    if (!clientId) return;
    try {
      let res;
      try {
        res = await axios.get(
          buildApiUrl(`/api/admin/holidays`, { clientId })
        );
      } catch (error: any) {
        if (error?.response?.status === 404) {
          res = await axios.get(
            buildApiUrl(`/admin/holidays`, { clientId })
          );
        } else {
          throw error;
        }
      }
      const list = Array.isArray(res.data) ? res.data : [];
      const normalized = list.map((holiday: Holiday) => ({
        ...holiday,
        holidayDate: normalizeHolidayDate(holiday.holidayDate),
      }));
      setHolidays(normalized);
      return normalized;
    } catch (err) {
      console.error('Error fetching holidays:', err);
      setHolidays([]);
      return [];
    }
  };

  useEffect(() => {
    if (employee?.id && employee?.companyCode) {
      setIsEmployeeReady(true);
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      fetchHolidays().then((holidayList) => {
        fetchMonthlyAttendance(month, year, holidayList);
      });
    }
  }, [employee]);

  useFocusEffect(
    useCallback(() => {
      if (!employee?.id || !clientId) return;
      fetchHolidays().then((holidayList) => {
        fetchMonthlyAttendance(visibleMonth.month, visibleMonth.year, holidayList);
      });
    }, [employee?.id, clientId, visibleMonth.month, visibleMonth.year])
  );

  useEffect(() => {
    if (isEmployeeReady) {
      fetchMonthlyAttendance(visibleMonth.month, visibleMonth.year, holidays);
    }
  }, [holidays]);

  const fetchMonthlyAttendance = async (
    month: number,
    year: number,
    holidayList: Holiday[] = holidays
  ) => {
    if (!isEmployeeReady) return;
    
    setIsLoadingMonthly(true);
    try {
      const url = buildApiUrl(`/api/attendance/monthly/${employeeId}/${year}/${String(month).padStart(2, '0')}`);
      
      const res = await axios.get(url, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
        },
        params: withClientId({}, clientId),
      });
      
      const data = res.data;

      const marked: MarkedDates = {};
      
      if (Array.isArray(data)) {
        data.forEach((item: AttendanceData) => {
          if (!item.date) return;
          
          try {
            let formattedDate = '';
            if (item.date.includes('/')) {
              const [dd, mm, yyyy] = item.date.split('/');
              formattedDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
            } else if (item.date.includes('-')) {
              formattedDate = item.date;
            }
            
            if (!formattedDate) return;
            
            let bgColor = '#F3F4F6';
            let textColor = '#1F2937';
            if (item.attendanceStatus === 'Present') bgColor = '#DCFCE7';
            else if (item.attendanceStatus === 'Absent') bgColor = '#FEE2E2';
            else if (item.attendanceStatus === 'Late') bgColor = '#FEF3C7';
            else if (item.attendanceStatus === 'Half Day') bgColor = '#FEF9C3';
            else if (item.attendanceStatus?.toLowerCase() === 'holiday') {
              bgColor = '#8B5CF6';
              textColor = '#FFFFFF';
            }

            marked[formattedDate] = {
              customStyles: {
                container: { backgroundColor: bgColor, borderRadius: 8 },
                text: { color: textColor, fontWeight: '600' },
              },
            };
          } catch (error) {
            console.error('Error processing date:', item.date, error);
          }
        });
      }

      holidayList
        .filter((holiday) => {
          if (!holiday?.holidayDate) return false;
          const date = new Date(holiday.holidayDate);
          return date.getMonth() + 1 === month && date.getFullYear() === year;
        })
        .forEach((holiday) => {
          const dateKey = holiday.holidayDate;
          if (!dateKey) return;
          marked[dateKey] = {
            customStyles: {
              container: { backgroundColor: '#8B5CF6', borderRadius: 8 },
              text: { color: '#FFFFFF', fontWeight: '600' },
            },
          };
        });
      
      setMarkedDates(marked);
    } catch (err: any) {
      console.error('Error fetching monthly attendance:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || err.message || 'Failed to load attendance data',
        [{ text: 'OK' }]
      );
      setMarkedDates({});
    } finally {
      setIsLoadingMonthly(false);
    }
  };

  const onDayPress = async (day: DateData) => {
    console.log('Day pressed:', day.dateString); // Debug log
    
    if (!isEmployeeReady) {
      Alert.alert('Please wait', 'Employee data is still loading...');
      return;
    }
    
    setSelectedDate(day.dateString);
    setSelectedHoliday(
      holidays.find((holiday) => holiday.holidayDate === day.dateString) || null
    );
    setLoading(true);
    
    try {
      const res = await axios.get(
        buildApiUrl(`/api/attendance/${employeeId}/${day.dateString}`), 
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
          params: withClientId({}, clientId),
        }
      );
      
      console.log('Daily attendance response:', res.data); // Debug log
      
      if (res.data && Object.keys(res.data).length > 0) {
        setAttendanceData(res.data);
      } else {
        setAttendanceData(null);
      }
    } catch (err: any) {
      console.error('Error fetching daily attendance:', err);
      
      if (err.response?.status === 404) {
        setAttendanceData(null);
      } else {
        Alert.alert(
          'Error',
          err.response?.data?.message || 'Failed to load daily attendance'
        );
        setAttendanceData(null);
      }
    } finally {
      setLoading(false);
      setModalVisible(true);
    }
  };

  const onMonthChange = (month: { month: number; year: number }) => {
    if (isEmployeeReady) {
      setVisibleMonth({ month: month.month, year: month.year });
      fetchHolidays().then((holidayList) => {
        fetchMonthlyAttendance(month.month, month.year, holidayList);
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      let date: Date;
      
      if (dateString.includes('/')) {
        const [dd, mm, yyyy] = dateString.split('/');
        date = new Date(Number.parseInt(yyyy), Number.parseInt(mm) - 1, Number.parseInt(dd));
      } else if (dateString.includes('-')) {
        date = new Date(dateString);
      } else {
        date = new Date(dateString);
      }
      
      if (Number.isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    
    try {
      const date = new Date(timeString);
      if (Number.isNaN(date.getTime())) {
        const regex = /(\d{1,2}):(\d{2})/;
        const match = regex.exec(timeString);
        if (match) {
          const hours = Number.parseInt(match[1]);
          const minutes = Number.parseInt(match[2]);
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        }
        return timeString;
      }
      
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString || '--:--';
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#757575';
    
    switch (status) {
      case 'Present': return '#4CAF50';
      case 'Absent': return '#F44336';
      case 'Late': return '#FF9800';
      case 'Half Day': return '#FFC107';
      case 'Holiday': return '#8B5CF6';
      case 'HOLIDAY': return '#8B5CF6';
      default: return '#757575';
    }
  };

  // Show loading while employee data is loading
  if (!isEmployeeReady) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#7726B9" />
        <Text style={styles.loadingText}>Loading employee data...</Text>
      </View>
    );
  }

  const renderModalContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
      );
    }
    
    if (selectedHoliday) {
      return (
        <>
          <View style={styles.dateHeader}>
            <Feather name="calendar" size={20} color="#8B5CF6" />
            <Text style={styles.dateText}>
              {formatDate(selectedHoliday.holidayDate)}
            </Text>
          </View>
          <View style={[
            styles.statusCard,
            { backgroundColor: '#8B5CF620' }
          ]}>
            <Text style={[styles.statusText, { color: '#8B5CF6' }]}>
              Holiday Today
            </Text>
            <Text style={styles.dayStatusText}>
              • {selectedHoliday.holidayName} ({selectedHoliday.holidayType === 'HALF' ? 'Half Day' : 'Full Day'})
            </Text>
          </View>
          {attendanceData && attendanceData.attendanceStatus !== 'Holiday' && (
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="clock" size={18} color="#6B7280" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time In</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(attendanceData.timeIn)}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="clock" size={18} color="#6B7280" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time Out</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(attendanceData.timeOut)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </>
      );
    }

    if (attendanceData) {
      return (
        <>
          <View style={styles.dateHeader}>
            <Feather name="calendar" size={20} color="#007AFF" />
            <Text style={styles.dateText}>
              {formatDate(attendanceData.date)}
            </Text>
          </View>

          <View style={[
            styles.statusCard,
            {backgroundColor: getStatusColor(attendanceData.attendanceStatus) + '20'}
          ]}>
            <Text style={[
              styles.statusText,
              {color: getStatusColor(attendanceData.attendanceStatus)}
            ]}>
              {attendanceData.attendanceStatus || 'No Status'}
            </Text>
            {!!attendanceData.dayStatus && (
              <Text style={styles.dayStatusText}>• {attendanceData.dayStatus}</Text>
            )}
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Feather name="clock" size={18} color="#6B7280" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Time In</Text>
                <Text style={styles.detailValue}>
                  {formatTime(attendanceData.timeIn)}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Feather name="clock" size={18} color="#6B7280" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Time Out</Text>
                <Text style={styles.detailValue}>
                  {formatTime(attendanceData.timeOut)}
                </Text>
              </View>
            </View>
            
            {!!attendanceData.location && (
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
            
            {attendanceData.missedTimes != null && attendanceData.missedTimes > 0 && (
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
            
            {!!attendanceData.timoutReason && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Feather name="info" size={18} color="#FF9800" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Reason</Text>
                  <Text style={[styles.detailValue, {color: '#FF9800'}]}>
                    {attendanceData.timoutReason}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {(!!attendanceData.imageInBase64 || !!attendanceData.imageOutBase64) && (
            <View style={styles.imagesSection}>
              <Text style={styles.sectionTitle}>Check-in Photos</Text>
              <View style={styles.imageRow}>
                {attendanceData.imageInBase64 ? (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ 
                        uri: `data:image/jpeg;base64,${attendanceData.imageInBase64}`,
                        cache: 'force-cache'
                      }} 
                      style={styles.image}
                      resizeMode="cover"
                      onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                    />
                    <Text style={styles.imageLabel}>Check-in</Text>
                  </View>
                ) : (
                  <View style={styles.noImageContainer}>
                    <Feather name="camera-off" size={32} color="#9CA3AF" />
                    <Text style={styles.noImageText}>No check-in photo</Text>
                  </View>
                )}
                
                {attendanceData.imageOutBase64 ? (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ 
                        uri: `data:image/jpeg;base64,${attendanceData.imageOutBase64}`,
                        cache: 'force-cache'
                      }} 
                      style={styles.image}
                      resizeMode="cover"
                      onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                    />
                    <Text style={styles.imageLabel}>Check-out</Text>
                  </View>
                ) : (
                  <View style={styles.noImageContainer}>
                    <Feather name="camera-off" size={32} color="#9CA3AF" />
                    <Text style={styles.noImageText}>No check-out photo</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </>
      );
    }
    
    return (
      <View style={styles.noDataContainer}>
        <Feather name="calendar" size={48} color="#9CA3AF" />
        <Text style={styles.noDataText}>No attendance record found for this date</Text>
        <Text style={styles.noDataSubtext}>
          {selectedDate ? formatDate(selectedDate) : 'Selected date'}
        </Text>
      </View>
    );
  };

  const getStatusBarPadding = () => {
    const iosPadding = 60;
    const androidPadding = StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40;
    return Platform.OS === 'ios' ? iosPadding : androidPadding;
  };

  const modalContainerStyle = {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: getStatusBarPadding(),
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#7726B9" barStyle="light-content" />
      <LinearGradient
        colors={['#7726B9', '#5E1D9E']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Attendance Log</Text>
      </LinearGradient>

      <View style={styles.calendarWrapper}>
        {isLoadingMonthly && (
          <View style={styles.monthlyLoading}>
            <ActivityIndicator size="small" color="#7726B9" />
          </View>
        )}
        
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={{
              ...markedDates,
              ...(selectedDate && {
                [selectedDate]: {
                  ...markedDates[selectedDate],
                  selected: true,
                  selectedColor: '#007AFF',
                }
              })
            }}
            onDayPress={onDayPress}
            onMonthChange={onMonthChange}
            markingType="custom"
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
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendar}
            enableSwipeMonths={true}
          />
        </View>
      </View>

      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="pageSheet"
        statusBarTranslucent={false}
      >
        <View style={modalContainerStyle}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Attendance Details</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {renderModalContent()}
          </ScrollView>
        </View>
      </Modal>
      
      <BottomNavBar activeTab="" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  calendarWrapper: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  monthlyLoading: {
    position: 'absolute',
    top: 0,
    right: 20,
    zIndex: 10,
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
    color: '#1F2937',
    fontWeight: '500',
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
    fontWeight: '600',
  },
  dot: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
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
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
  },
  modalContent: {
    flex: 1,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
    marginHorizontal: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayStatusText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    marginHorizontal: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
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
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  imagesSection: {
    marginBottom: 24,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#F3F4F6',
  },
  imageLabel: {
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
  },
  noImageContainer: {
    flex: 1,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  noImageText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 16,
  },
  noDataContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
