import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import { EmployeeContext } from '../context/EmployeeContext';

// Type definitions
type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

type AttendanceData = {
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  attendanceStatus?: string;
};

type EmployeeInfoProps = {
  employeeId: string;
};

const AttendanceActivity: React.FC<EmployeeInfoProps> = ({ employeeId }) => {
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState<AttendanceData[]>([]);
 const {  employee, setEmployee } = useContext(EmployeeContext);
//  const { employee, setEmployee, logout } = useContext(EmployeeContext);
 const companyCode = employee?.companyCode;
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      const today = new Date();
      const promises: Promise<AttendanceData | null>[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const formatted = d.toLocaleDateString('en-GB'); // dd/mm/yyyy

        promises.push(
          axios
            .get<AttendanceData | null>(
              `https://${companyCode}.iieawstesting.in/api/attendance/getByDateAndEmployee`,
              { params: { date: formatted, employeeId } }
            )
            .then((res) =>
              res.data ? { ...res.data, date: formatted } : null
            )
            .catch(() => null)
        );
      }

      const results = await Promise.all(promises);

      // Deduplicate by date
      const map = new Map<string, AttendanceData>();
      results.forEach((row) => {
        if (row) map.set(row.date, row);
      });

      setAttendances([...map.values()]);
      setLoading(false);
    };

    fetchAttendance();
  }, [employeeId]);

  const times: {
    label: string;
    key: 'timeIn' | 'timeOut';
    icon: FeatherIconName;
  }[] = [
    { label: 'Clock-In', key: 'timeIn', icon: 'log-in' },
    { label: 'Clock-Out', key: 'timeOut', icon: 'log-out' },
  ];

  const getDayName = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/');
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  if (loading)
    return <ActivityIndicator size="large" color="blue" style={styles.center} />;

  if (attendances.length === 0)
    return (
      <Text style={[styles.center, styles.noData]}>
        No attendance data found for last 7 days.
      </Text>
    );

  return (
    <View style={[styles.clockSection, { height: 300 }]}>
      <ScrollView
        style={styles.scrollWrapper}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.heading}>Attendance Activity</Text>

        {attendances.map((attendance, index) => {
          const isAbsent = attendance.attendanceStatus === 'Absent';

          if (isAbsent) {
            return (
              <View key={`absent-${index}`} style={styles.clockCard}>
                <View style={styles.absentIconCircle}>
                  <Feather name="x-circle" size={24} color="red" />
                </View>
                <View style={styles.clockInfo}>
                  <Text style={styles.absentLabel}>Absent</Text>
                  <Text>
                    {attendance.date} - {getDayName(attendance.date)}
                  </Text>
                </View>
              </View>
            );
          }

          if (!attendance.timeIn && !attendance.timeOut) return null;

          return times.map((item, subIndex) => {
            const timeValue = attendance[item.key];
            if (!timeValue) return null;

            return (
              <View key={`${index}-${subIndex}`} style={styles.clockCard}>
                <View
                  style={[styles.iconCircle, { backgroundColor: '#FFCCCC' }]}
                >
                  <Feather name={item.icon} size={24} color="red" />
                </View>
                <View style={styles.clockInfo}>
                  <Text style={styles.clockTitle}>{item.label}</Text>
                  <Text>
                    {attendance.date} - {getDayName(attendance.date)}
                  </Text>
                </View>
                <View style={styles.clockTime}>
                  <Text>
                    {new Date(timeValue).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            );
          });
        })}
      </ScrollView>
    </View>
  );
};

export default AttendanceActivity;

const styles = StyleSheet.create({
  clockSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  clockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  absentIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  absentLabel: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 14,
  },
  center: {
    marginTop: 30,
    alignSelf: 'center',
  },
  noData: {
    color: 'gray',
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
