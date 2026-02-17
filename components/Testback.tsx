import DayStart from "../components/DayStart";
import { EmployeeContext } from "../context/EmployeeContext";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import React, { useContext, useEffect, useState, useCallback } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";

const AttendanceFlow: React.FC = () => {
  const { employee } = useContext(EmployeeContext);
  const employeeId = employee?.id;
  const companyCode = employee?.companyCode;
  const [record, setRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [view, setView] = useState<"main" | "start" | "timeIn" | "timeOut" | "closed">("main");
  const [navigationInProgress, setNavigationInProgress] = useState(false);

  const today = formatDDMMYYYY(new Date());

  // Fetch record with better error handling
  const fetchRecord = useCallback(async (showLoading = true) => {
    if (!employeeId || !companyCode) {
      setInitialLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    
    try {
      const { data } = await axios.get<Record>(
        `https://${companyCode}.zentime.co.in/api/attendance/latest/${employeeId}`
      );

      // Validate if the fetched record is for today
      if (data.date === today) {
        setRecord(data);
        
        // Determine view based on record state
        if (!data.timeIn && !data.imageIn) {
          setView("main"); // Show ClockIn button
        } else if (data.timeIn && data.imageIn && (!data.timeOut || !data.imageOut)) {
          setView("main"); // Show ClockOut button
        } else if (data.timeIn && data.imageIn && data.timeOut && data.imageOut && data.dayStatus !== "Completed") {
          setView("main"); // Show Day Close button
        } else if (data.dayStatus === "Completed") {
          setView("closed");
        }
      } else {
        // No record for today
        setRecord(null);
        setView("start");
      }
    } catch (error) {
      console.log("No active record found:", error);
      setRecord(null);
      setView("start");
    } finally {
      if (showLoading) setLoading(false);
      setInitialLoading(false);
    }
  }, [employeeId, companyCode, today]);

  // Initial fetch
  useEffect(() => {
    fetchRecord(true);
  }, [employeeId]);

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
          const dayOfWeek = now.getDay();

          const SUNDAY_ALLOWED_TIME = 14 * 60;
          const MONDAY_ALLOWED_TIME = 15 * 60 + 30;
          const WEEKDAY_ALLOWED_TIME = 19 * 60;

          let allowedTimeInMinutes;
          
          if (dayOfWeek === 0) {
            allowedTimeInMinutes = SUNDAY_ALLOWED_TIME;
          } else if (dayOfWeek === 1) {
            allowedTimeInMinutes = MONDAY_ALLOWED_TIME;
          } else {
            allowedTimeInMinutes = WEEKDAY_ALLOWED_TIME;
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
      return {
        label: "Start Day",
        action: () => setView("start")
      };
    }
    
    if (!record.timeIn && !record.imageIn) {
      return {
        label: "Clock In",
        action: () => setView("timeIn")
      };
    }
    
    if (record.timeIn && record.imageIn && (!record.timeOut || !record.imageOut)) {
      return {
        label: "Clock Out",
        action: () => setView("timeOut")
      };
    }
    
    if (record.timeIn && record.imageIn && record.timeOut && record.imageOut && record.dayStatus !== "Completed") {
      return {
        label: "Close Day",
        action: () => handleDayClose(record.id!)
      };
    }
    
    return {
      label: "Day Completed",
      action: () => {}
    };
  }, [record]);

  const handleDayClose = async (recordId: number) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `https://${companyCode}.zentime.co.in/api/attendance/update-day-status`,
        null,
        { params: { recordId, dayStatus: "Completed" } }
      );
      
      Alert.alert("Success", "Day closed successfully!");
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
    setView("main");
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

  // Render based on view
  if (view === "start") {
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
  const isDisabled = loading || label === "Day Completed";

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
              name={label === "Start Day" ? "wb-sunny" : "touch-app"} 
              size={38} 
              color={isDisabled ? "#9CA3AF" : "#351153"} 
            />
            <Text style={[styles.touchText, isDisabled && styles.disabledText]}>
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

function formatDDMMYYYY(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
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
});

export default AttendanceFlow;