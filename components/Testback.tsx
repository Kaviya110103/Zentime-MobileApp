import DayStart from "../components/DayStart";
import { EmployeeContext } from "../context/EmployeeContext";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import React, { useContext, useEffect, useState, useCallback } from "react";
import { Alert, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { AppText as Text } from './AppTypography';
import { buildApiUrl, withClientId } from "../lib/api";
import { syncAttendanceNotifications } from "../lib/employeeNotifications";

const AttendanceFlow: React.FC = () => {
  const { employee } = useContext(EmployeeContext);
  const employeeId = employee?.id;
  const companyCode = employee?.companyCode;
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [holidayLoading, setHolidayLoading] = useState(true);
  const [holidayToday, setHolidayToday] = useState<HolidayInfo | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(true);
  const [leaveToday, setLeaveToday] = useState(false);
  const [view, setView] = useState<"main" | "start" | "timeIn" | "timeOut" | "closed">("main");
  const [navigationInProgress, setNavigationInProgress] = useState(false);

  // Fetch record with better error handling
  const fetchRecord = useCallback(async (showLoading = true) => {
    if (!employeeId || !companyCode) {
      setInitialLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    
    try {
      const { data } = await axios.get<Record>(
        buildApiUrl(`/api/attendance/latest-today-or-yesterday/${employeeId}`, { clientId: employee?.clientId })
      );

      if ((data as any)?.found === false) {
        setRecord(null);
        setView("start");
        await syncAttendanceNotifications({
          employee,
          attendance: null,
          isWorkingDay: isWorkingDayToday(employee, holidayToday, nowDate()),
          onLeaveToday: leaveToday,
        });
        return;
      }

      // Validate if the fetched record is for today (supports both dd/MM/yyyy and yyyy-MM-dd)
      if (isSameDateString(String(data.date || ""), nowDate())) {
        setRecord(data);
        await syncAttendanceNotifications({
          employee,
          attendance: data,
          isWorkingDay: isWorkingDayToday(employee, holidayToday, nowDate()),
          onLeaveToday: leaveToday,
        });
        
        // Determine view based on record state
        if (!data.timeIn) {
          setView("main"); // Show ClockIn button
        } else if (data.timeIn && !data.timeOut) {
          setView("main"); // Show ClockOut button
        } else if (data.timeIn && data.timeOut && data.dayStatus !== "Completed") {
          setView("main"); // Show Day Close button
        } else if (data.dayStatus === "Completed") {
          setView("closed");
        }
      } else {
        // No record for today
        setRecord(null);
        setView("start");
        await syncAttendanceNotifications({
          employee,
          attendance: null,
          isWorkingDay: isWorkingDayToday(employee, holidayToday, nowDate()),
          onLeaveToday: leaveToday,
        });
      }
    } catch (error) {
      if ((error as any)?.response?.status !== 404) {
        console.log("No active record found:", error);
      }
      setRecord(null);
      setView("start");
      await syncAttendanceNotifications({
        employee,
        attendance: null,
        isWorkingDay: isWorkingDayToday(employee, holidayToday, nowDate()),
        onLeaveToday: leaveToday,
      });
    } finally {
      if (showLoading) setLoading(false);
      setInitialLoading(false);
    }
  }, [employee, employeeId, companyCode, employee?.clientId, holidayToday, leaveToday]);

  const fetchTodayHoliday = useCallback(async () => {
    if (!employeeId || !employee?.clientId) {
      setHolidayToday(null);
      setHolidayLoading(false);
      return;
    }

    setHolidayLoading(true);
    try {
      const now = new Date();
      const { data } = await axios.get<HolidayInfo[]>(
        buildApiUrl(`/api/employee/holidays/monthly/${employeeId}/${now.getFullYear()}/${now.getMonth() + 1}`),
        { params: withClientId({}, employee.clientId) }
      );

      const holidays = Array.isArray(data) ? data : [];
      const match = holidays.find((holiday) => isSameDateString(holiday.holidayDate, now)) || null;
      setHolidayToday(match);
    } catch (error) {
      console.log("Holiday fetch failed:", (error as any)?.message);
      setHolidayToday(null);
    } finally {
      setHolidayLoading(false);
    }
  }, [employeeId, employee?.clientId]);

  const fetchTodayLeave = useCallback(async () => {
    if (!employeeId || !employee?.clientId) {
      setLeaveToday(false);
      setLeaveLoading(false);
      return;
    }

    setLeaveLoading(true);
    try {
      const { data } = await axios.get<LeaveInfo[]>(
        buildApiUrl(`/api/leaves/employee/${employeeId}`, { clientId: employee.clientId })
      );

      const leaves = Array.isArray(data) ? data : [];
      const current = nowDate();
      const isOnApprovedLeaveToday = leaves.some((leave) => {
        if (!leave) return false;
        if ((leave.status || "").trim().toLowerCase() !== "approved") return false;
        if (isPermissionType(leave.leaveType)) return false;

        const start = parseFlexibleDate(leave.startDate || leave.date);
        const end = parseFlexibleDate(leave.endDate || leave.startDate || leave.date);
        if (!start || !end) return false;
        return isDateWithinInclusive(current, start, end);
      });

      setLeaveToday(isOnApprovedLeaveToday);
    } catch (error) {
      console.log("Leave fetch failed:", (error as any)?.message);
      setLeaveToday(false);
    } finally {
      setLeaveLoading(false);
    }
  }, [employeeId, employee?.clientId]);

  // Initial fetch
  useEffect(() => {
    fetchRecord(true);
    fetchTodayHoliday();
    fetchTodayLeave();
  }, [fetchRecord, fetchTodayHoliday, fetchTodayLeave]);

  // Handle navigation based on view
  useEffect(() => {
    if (navigationInProgress || !record?.id) return;

    const performNavigation = async () => {
      setNavigationInProgress(true);
      
      try {
        if (view === "timeIn") {
          await router.push(`/MarkTimeIn?recordId=${record.id}`);
        } else if (view === "timeOut") {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinutes = now.getMinutes();
          const currentTimeInMinutes = currentHour * 60 + currentMinutes;
          const configuredShiftEnd = parseTimeStringToMinutes(employee?.shiftEndTime);
          let allowedTimeInMinutes = configuredShiftEnd;

          if (allowedTimeInMinutes == null) {
            const dayOfWeek = now.getDay();
            const SUNDAY_ALLOWED_TIME = 14 * 60;
            const MONDAY_ALLOWED_TIME = 15 * 60 + 30;
            const WEEKDAY_ALLOWED_TIME = 19 * 60;

            if (dayOfWeek === 0) {
              allowedTimeInMinutes = SUNDAY_ALLOWED_TIME;
            } else if (dayOfWeek === 1) {
              allowedTimeInMinutes = MONDAY_ALLOWED_TIME;
            } else {
              allowedTimeInMinutes = WEEKDAY_ALLOWED_TIME;
            }
          }
          
          const isAllowedToClockOut = currentTimeInMinutes >= allowedTimeInMinutes;

          if (isAllowedToClockOut) {
            await router.push(`/MarkTimeOut?recordId=${record.id}`);
          } else {
            const hours = Math.floor(allowedTimeInMinutes / 60);
            const minutes = allowedTimeInMinutes % 60;
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours > 12 ? hours - 12 : hours;
            const timeLimit = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
            
            Alert.alert(
              "Early Clock-Out",
              `You can only clock out after ${timeLimit}. Do you want to request permission?`,
              [
                { text: "Cancel", style: "cancel", onPress: () => setView("main") },
                {
                  text: "Request Permission",
                  onPress: () => router.push(`/EmployeePermission?recordId=${record.id}`)
                }
              ]
            );
          }
        }
      } catch (error) {
        console.error("Navigation error:", error);
        Alert.alert("Error", "Failed to navigate. Please try again.");
        setView("main");
      } finally {
        setNavigationInProgress(false);
      }
    };

    if (view === "timeIn" || view === "timeOut") {
      performNavigation();
    }
  }, [view, record]);

  const determineAction = useCallback((): { label: string; action: () => void } => {
    if (!record) {
      if (holidayToday) {
        return {
          label: "Holiday",
          action: () => {}
        };
      }

      return {
        label: "Start Day",
        action: () => setView("start")
      };
    }
    
    if (!record.timeIn) {
      return {
        label: "Clock In",
        action: () => setView("timeIn")
      };
    }
    
    if (record.timeIn && !record.timeOut) {
      return {
        label: "Clock Out",
        action: () => setView("timeOut")
      };
    }
    
    if (record.timeIn && record.timeOut && record.dayStatus !== "Completed") {
      return {
        label: "Close Day",
        action: () => handleDayClose(record.id!)
      };
    }
    
    return {
      label: "Day Completed",
      action: () => {}
    };
  }, [record, holidayToday]);

  const handleDayClose = async (recordId: number) => {
    setLoading(true);
    try {
      const recordCheck = await axios.get(
        buildApiUrl(`/api/attendance/check-record`),
        {
          params: withClientId(
            { employeeId: employee?.id, recordId },
            employee?.clientId
          ),
        }
      );
      if (!recordCheck?.data) {
        Alert.alert("Error", "Attendance record is no longer valid. Please refresh.");
        await fetchRecord(true);
        return;
      }

      const res = await axios.post(
        buildApiUrl(`/api/attendance/update-day-status`),
        null,
        { params: withClientId({ recordId, dayStatus: "Completed" }, employee?.clientId) }
      );
      
      await fetchRecord(true);
      setView("closed");
    } catch (err: any) {
      const msg = err.response?.data || err.message || "Failed to close day.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleActionPress = () => {
    if (loading) return;
    const { action } = determineAction();
    action();
  };

  const handleDayStarted = async () => {
    await fetchRecord(true);
    setView("timeIn");
  };

  const handleBackToMain = async () => {
    await fetchRecord(true);
    setView("main");
    router.push("/MarkAttendance");
  };

  if (initialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#351153" />
      </View>
    );
  }

  if (holidayLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#351153" />
      </View>
    );
  }

  if (leaveLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#351153" />
      </View>
    );
  }

  // Render based on view
  if (view === "start") {
    if (holidayToday) {
      return (
        <View style={styles.centerContainer}>
          <TouchableOpacity style={[styles.touchIconBox, styles.disabledBox]} disabled>
            <MaterialIcons name="celebration" size={34} color="#2563EB" />
            <Text style={[styles.touchText, styles.holidayText]}>Holiday</Text>
            <Text style={styles.holidaySubText}>{holidayToday.holidayName || "Holiday"}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return employeeId ? (
      <DayStart 
        employeeId={Number(employeeId)} 
        onDone={handleDayStarted}
        onCancel={() => setView("main")}
      />
    ) : null;
  }

  if (view === "closed") {
    return (
      <View style={styles.centerContainer}>
        <TouchableOpacity style={styles.touchIconBox} disabled>
          <MaterialIcons name="check-circle" size={34} color="#4CAF50" />
          <Text style={styles.touchText}>Day Closed</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { label } = determineAction();
  const isDisabled = loading || label === "Day Completed" || label === "Holiday";

  return (
    <View style={styles.centerContainer}>
      <TouchableOpacity
        style={[styles.touchIconBox, isDisabled && styles.disabledBox]}
        onPress={handleActionPress}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#351153" />
        ) : (
          <>
            <MaterialIcons 
              name={label === "Start Day" ? "wb-sunny" : label === "Holiday" ? "celebration" : "touch-app"} 
              size={38} 
              color={label === "Holiday" ? "#2563EB" : isDisabled ? "#9CA3AF" : "#351153"} 
            />
            <Text style={[styles.touchText, label === "Holiday" ? styles.holidayText : isDisabled && styles.disabledText]}>
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

type Record = {
  id?: number;
  employee?: object;
  timeIn?: string;
  imageIn?: string;
  timeOut?: string;
  imageOut?: string;
  dayStatus?: string;
  attendanceStatus?: string;
  date?: string;
};

type HolidayInfo = {
  holidayDate: string;
  holidayName: string;
  holidayType?: string;
};

type LeaveInfo = {
  date?: string;
  startDate?: string;
  endDate?: string;
  leaveType?: string;
  status?: string;
};

function formatDDMMYYYY(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function parseTimeStringToMinutes(timeString?: string | null): number | null {
  if (!timeString) return null;
  const parts = timeString.split(":");
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

function isSameDateString(dateStr: string, target: Date) {
  if (!dateStr) return false;
  const safe = dateStr.trim();
  const yyyyMmDd = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
  const ddMmYyyy = formatDDMMYYYY(target);
  return safe === yyyyMmDd || safe === ddMmYyyy;
}

function isPermissionType(leaveType?: string | null) {
  return String(leaveType ?? "").trim().toLowerCase().includes("permission");
}

function parseFlexibleDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const value = raw.trim();

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const dt = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const dmy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) {
    const dt = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isDateWithinInclusive(target: Date, start: Date, end: Date) {
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return t >= Math.min(s, e) && t <= Math.max(s, e);
}

function nowDate() {
  return new Date();
}

function parseWeekOffDay(raw?: string | null): number | null {
  if (!raw) return null;
  const normalized = raw.trim().toUpperCase();
  if (normalized.startsWith("SUN")) return 0;
  if (normalized.startsWith("MON")) return 1;
  if (normalized.startsWith("TUE")) return 2;
  if (normalized.startsWith("WED")) return 3;
  if (normalized.startsWith("THU")) return 4;
  if (normalized.startsWith("FRI")) return 5;
  if (normalized.startsWith("SAT")) return 6;
  return null;
}

function isWorkingDayToday(
  employee: any,
  holidayToday: HolidayInfo | null,
  current: Date
): boolean {
  if (holidayToday) {
    return false;
  }

  const leavePolicy = String(employee?.leavePolicyType ?? "").trim().toUpperCase();
  const weekOff = String(employee?.weekOff ?? "").trim().toUpperCase();
  const day = current.getDay();

  const weekendOff =
    leavePolicy.includes("WEEKEND") ||
    (leavePolicy.includes("SAT") && leavePolicy.includes("SUN")) ||
    (weekOff.includes("SAT") && weekOff.includes("SUN"));

  if (weekendOff) {
    return day !== 0 && day !== 6;
  }

  const singleWeekOff = parseWeekOffDay(employee?.weekOff);
  if (singleWeekOff == null) {
    return day !== 0;
  }
  return day !== singleWeekOff;
}

const styles = StyleSheet.create({
  centerContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  touchIconBox: {
    backgroundColor: "#FFFFFF",
    padding: 28,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    shadowColor: "#351153",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(53,17,83,0.1)",
  },
  disabledBox: {
    opacity: 0.7,
    backgroundColor: "#F3F4F6",
  },
  touchText: {
    marginTop: 10,
    fontSize: 16,
    color: "#351153",
    fontWeight: "600",
  },
  disabledText: {
    color: "#9CA3AF",
  },
  holidayText: {
    color: "#2563EB",
  },
  holidaySubText: {
    marginTop: 6,
    fontSize: 12,
    color: "#4B5563",
    textAlign: "center",
  },
});

export default AttendanceFlow;


