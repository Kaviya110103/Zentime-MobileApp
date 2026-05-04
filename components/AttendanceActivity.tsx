import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from './AppTypography';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import { EmployeeContext } from '../context/EmployeeContext';
import { buildApiUrl, withClientId } from '../lib/api';

// Type definitions
type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

type AttendanceData = {
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  attendanceStatus?: string;
};

type EmployeeInfoProps = {
  employeeId?: string | number;
};

const AttendanceActivity: React.FC<EmployeeInfoProps> = ({ employeeId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<AttendanceData[]>([]);
  const { employee } = useContext(EmployeeContext);
  const companyCode = employee?.companyCode;
  const clientId = employee?.clientId;

  const formatDateForApi = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!employeeId || !clientId) {
        setAttendances([]);
        setError(null);
        setLoading(false);
        return;
      }

      if (!companyCode) {
        setAttendances([]);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const today = new Date();
        const promises: Promise<AttendanceData | null>[] = [];

        // Fetch last 7 days
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const formatted = formatDateForApi(d); // dd/MM/yyyy

          promises.push(
            axios
              .get<AttendanceData | null>(
                buildApiUrl('/api/attendance/getByDateAndEmployee'),
                { params: withClientId({ date: formatted, employeeId }, clientId) }
              )
              .then((res) => {
                if (!res.data || (res.data as any).found === false) return null;
                return { ...res.data, date: formatted };
              })
              .catch((err) => {
                if (err?.response?.status !== 404) {
                  console.log(`Error fetching ${formatted}:`, err.message);
                }
                return null;
              })
          );
        }

        const results = await Promise.all(promises);
        
        // Filter out null results and deduplicate
        const validResults = results.filter((result): result is AttendanceData => 
          result?.date !== undefined
        );
        
        // Sort by date (newest first)
        validResults.sort((a, b) => {
          const dateA = new Date(a.date.split('/').reverse().join('-'));
          const dateB = new Date(b.date.split('/').reverse().join('-'));
          return dateB.getTime() - dateA.getTime();
        });

        console.log('Fetched attendances:', validResults);
        
        setAttendances(validResults);
      } catch (err: any) {
        console.error('Error fetching attendance:', err);
        setError('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [employeeId, companyCode, clientId]);

  // getDayName is defined here but not used - keeping for potential future use
  const getShortDayName = (dateStr: string) => {
    try {
      const [day, month, year] = dateStr.split('/');
      const date = new Date(`${year}-${month}-${day}`);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } catch (err) {
      console.error('Error parsing date in getShortDayName:', err);
      return '???';
    }
  };

  const formatTime = (timeValue: string | null) => {
    if (!timeValue) return '--:--';
    try {
      return new Date(timeValue).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (err) {
      console.error('Error formatting time:', err);
      return '??:??';
    }
  };

  const getAttendanceStatus = (attendance: AttendanceData) => {
    if (attendance.attendanceStatus === 'Absent') return 'absent';
    if (attendance.timeIn) return 'present';
    return 'no-data';
  };

  console.log('Component state:', { loading, error, attendancesCount: attendances.length });

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Feather name="alert-circle" size={48} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Generate last 7 days even if no data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return formatDateForApi(d);
  }).reverse();

  // Create a map of attendance data by date for easy lookup
  const attendanceMap = new Map<string, AttendanceData>();
  attendances.forEach(att => attendanceMap.set(att.date, att));

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Attendance Activity</Text>
      
      {attendances.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="calendar" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No attendance records found</Text>
          <Text style={styles.emptySubtext}>Showing last 7 days</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, styles.dayCell]}>
              <Text style={styles.headerText}>Day</Text>
            </View>
            <View style={[styles.headerCell, styles.statusCell]}>
              <Text style={styles.headerText}>Status</Text>
            </View>
            <View style={[styles.headerCell, styles.timeCell]}>
              <Text style={styles.headerText}>In</Text>
            </View>
            <View style={[styles.headerCell, styles.timeCell]}>
              <Text style={styles.headerText}>Out</Text>
            </View>
            <View style={[styles.headerCell, styles.totalCell]}>
              <Text style={styles.headerText}>Total</Text>
            </View>
          </View>

          {last7Days.map((date, index) => {
            const attendance = attendanceMap.get(date) || {
              date,
              timeIn: null,
              timeOut: null,
              attendanceStatus: undefined
            };
            
            const status = getAttendanceStatus(attendance);
            const dayName = getShortDayName(date);
            const formattedDate = date.split('/')[0];

            const getStatusConfig = (status: string) => {
              switch (status) {
                case 'absent':
                  return {
                    label: 'Absent',
                    color: '#dc3545',
                    bgColor: '#ffe6e6',
                    icon: 'x-circle' as FeatherIconName,
                  };
                case 'present':
                  return {
                    label: 'Present',
                    color: '#28a745',
                    bgColor: '#e6ffed',
                    icon: 'check-circle' as FeatherIconName,
                  };
                case 'no-data':
                default:
                  return {
                    label: 'No Data',
                    color: '#6c757d',
                    bgColor: '#f8f9fa',
                    icon: 'help-circle' as FeatherIconName,
                  };
              }
            };
            
            const statusConfig = getStatusConfig(status);

            // Calculate total hours
            let totalHours = '--:--';
            if (attendance.timeIn && attendance.timeOut) {
              try {
                const diffMs = new Date(attendance.timeOut).getTime() - new Date(attendance.timeIn).getTime();
                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                totalHours = `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}`;
              } catch (err) {
                console.error('Error calculating total hours:', err);
                totalHours = '??:??';
              }
            } else if (attendance.timeIn) {
              totalHours = 'In Progress';
            }

            // Determine total hours style
            let totalHoursStyle = styles.totalAbsent;
            if (totalHours === 'In Progress') {
              totalHoursStyle = styles.totalPartial;
            } else if (totalHours !== '--:--') {
              totalHoursStyle = styles.totalPresent;
            }

            return (
              <View key={date} style={styles.row}>
                {/* Day Column */}
                <View style={[styles.dataCell, styles.dayCell]}>
                  <Text style={styles.dayName}>{dayName}</Text>
                  <Text style={styles.dateNumber}>{formattedDate}</Text>
                </View>

                {/* Status Column */}
                <View style={[styles.dataCell, styles.statusCell]}>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                    <Feather name={statusConfig.icon} size={14} color={statusConfig.color} />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                {/* Clock-In Column */}
                <View style={[styles.dataCell, styles.timeCell]}>
                  <View style={styles.timeContainer}>
                    <Feather 
                      name="log-in" 
                      size={14} 
                      color={attendance.timeIn ? "#28a745" : "#6c757d"} 
                      style={styles.timeIcon} 
                    />
                    <Text style={[
                      styles.timeText, 
                      attendance.timeIn ? styles.timePresent : styles.timeAbsent
                    ]}>
                      {formatTime(attendance.timeIn)}
                    </Text>
                  </View>
                </View>

                {/* Clock-Out Column */}
                <View style={[styles.dataCell, styles.timeCell]}>
                  <View style={styles.timeContainer}>
                    <Feather 
                      name="log-out" 
                      size={14} 
                      color={attendance.timeOut ? "#dc3545" : "#6c757d"} 
                      style={styles.timeIcon} 
                    />
                    <Text style={[
                      styles.timeText, 
                      attendance.timeOut ? styles.timePresent : styles.timeAbsent
                    ]}>
                      {formatTime(attendance.timeOut)}
                    </Text>
                  </View>
                </View>

                {/* Total Hours Column */}
                <View style={[styles.dataCell, styles.totalCell]}>
                  <Text style={[styles.totalText, totalHoursStyle]}>
                    {totalHours}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

export default AttendanceActivity;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 320,
    maxHeight: 400,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#dc3545',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
    marginBottom: 4,
  },
  headerCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  dataCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    flex: 0.8,
  },
  statusCell: {
    flex: 1.2,
  },
  timeCell: {
    flex: 1,
  },
  totalCell: {
    flex: 0.9,
  },
  dayName: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    minWidth: 70,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeIcon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'center',
  },
  timePresent: {
    color: '#333',
  },
  timeAbsent: {
    color: '#999',
  },
  totalText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 60,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  totalPresent: {
    color: '#007bff',
    backgroundColor: '#e6f2ff',
  },
  totalPartial: {
    color: '#ff9800',
    backgroundColor: '#fff3e0',
    fontSize: 10,
  },
  totalAbsent: {
    color: '#999',
    backgroundColor: '#f5f5f5',
  },
});

