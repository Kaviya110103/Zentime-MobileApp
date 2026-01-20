import DayStart from "../components/DayStart";
import { EmployeeContext } from "../context/EmployeeContext";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const AttendanceFlow: React.FC = () => {
  const { employee } = useContext(EmployeeContext);
  const employeeId = employee?.id;
  // const {  employee, setEmployee } = useContext(EmployeeContext);
  const companyCode = employee?.companyCode;
  const [record, setRecord] = useState<Record | null>(null);
  const [missing, setMissing] = useState<string[]>([]); // This state is not directly used in rendering but kept for potential future debugging/info.
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<
    "main" | "start" | "timeIn" | "timeOut" | "closed"
  >("main"); // Removed 'close' as a direct view state, it's now an action.

  const today = formatDDMMYYYY(new Date());

  // Effect to fetch the latest attendance record when employeeId changes
  useEffect(() => {
    if (employeeId) {
      fetchRecord();
    }
  }, [employeeId]);

  // Effect to navigate or show alerts based on the 'view' state
  useEffect(() => {
    if (!record?.id) return;

    if (view === "timeIn") {
      router.push(`/MarkTimeIn?recordId=${record.id}`);
    } else if (view === "timeOut") {
      const now = new Date();
      const currentHour = now.getHours();

      // Check if trying to clock out before 7:00 PM
      if (currentHour < 19) {
        Alert.alert(
          "Warning",
          "You are trying to Clock-Out before 7:00 PM.\nDo you want to request permission instead?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setView("main"); // return to main
              },
            },
            {
              text: "Yes, Request Permission",
              style: "destructive",
              onPress: () => {
                router.push(`/EmployeePermission?recordId=${record.id}`);
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        router.push(`/MarkTimeOut?recordId=${record.id}`);
      }
    }
  }, [view, record]);

  /**
   * Fetches the latest attendance record for the employee.
   * Updates 'record' state and determines missing fields.
   */
  async function fetchRecord() {
    try {
      const { data } = await axios.get<Record>(
        `https://${companyCode}.zentime.co.in/api/attendance/latest/${employeeId}`
      );

      // Validate if the fetched record is for today and attendance status is 'Present'
      if (data.date !== today || data.attendanceStatus !== "Present") {
        throw new Error("Not today's record or attendance not present.");
      }

      setRecord(data);

      // Determine which fields are missing for the current record
      const want = [
        { key: "employee", present: !!data.employee },
        { key: "date", present: data.date === today },
        { key: "attendanceStatus", present: data.attendanceStatus === "Present" },
        { key: "timeIn", present: !!data.timeIn },
        { key: "imageIn", present: !!data.imageIn },
        { key: "timeOut", present: !!data.timeOut },
        { key: "imageOut", present: !!data.imageOut },
        { key: "dayStatus", present: !!data.dayStatus },
      ];

      setMissing(want.filter((w) => !w.present).map((w) => w.key));
    } catch (error) {
      // If no record or invalid record, reset state and set view to 'start'
      console.error("Error fetching record:", error);
      setRecord(null);
      setMissing([
        "employee",
        "date",
        "attendanceStatus",
        "timeIn",
        "imageIn",
        "timeOut",
        "imageOut",
        "dayStatus",
      ]);
      setView("start");
    }
  }

  /**
   * Determines the appropriate action label and next view based on the current record status.
   */
  function determineAction(): { label: string; nextView: typeof view | "closeAction" } {
    if (!record) return { label: "Hello", nextView: "start" };
    if (!record.timeIn && !record.imageIn) return { label: "ClockIn", nextView: "timeIn" };
    if (record.timeIn && record.imageIn && (!record.timeOut || !record.imageOut))
      return { label: "ClockOut", nextView: "timeOut" };
    if (
      record.timeIn &&
      record.imageIn &&
      record.timeOut &&
      record.imageOut &&
      record.dayStatus !== "Completed"
    )
      return { label: "Day Close", nextView: "closeAction" }; // Use a special 'closeAction' to trigger the API call
    return { label: "Closed", nextView: "closed" }; // Day is completed
  }

  /**
   * Handles the "Day Close" action by making an API call to update the day status.
   */
  const handleDayClose = async (recordId: number) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `https://${companyCode}.zentime.co.in/api/attendance/update-day-status`,
        null, // No request body needed for params
        {
          params: {
            recordId,
            dayStatus: "Completed"
          }
        }
      );
      Alert.alert("Success", res.data);
      await fetchRecord(); // Re-fetch record to get updated dayStatus
      setView("closed"); // Set view to 'closed' after successful day close
    } catch (err: any) {
      const msg =
        err.response?.data ||
        err.message ||
        "Failed to close day. Try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the press event on the main action button.
   * Triggers navigation or the day close API call.
   */
  function onActionPress() {
    const { label, nextView } = determineAction();
    if (nextView === "closeAction" && record?.id) {
      handleDayClose(record.id); // Call the day close API handler
    } else if (label !== "Closed") {
      setView(nextView as typeof view); // Set view for other actions
    }
  }

  /**
   * Navigates back to the main view after an action is completed (e.g., DayStart).
   * Re-fetches the record to ensure the UI is up-to-date.
   */
  async function backToMain() {
    setLoading(true);
    await fetchRecord();
    setView("main");
    setLoading(false);
    router.push("/MarkAttendance"); // Assuming this is the main attendance screen route
  }

  /**
   * Renders the appropriate component based on the current 'view' state.
   */
  function renderCurrentView() {
    switch (view) {
      case "start":
        return employeeId ? (
          <DayStart employeeId={Number(employeeId)} onDone={backToMain} />
        ) : null;

      case "closed":
        return (
          <View style={styles.centerContainer}>
            <TouchableOpacity style={styles.touchIconBox} disabled>
              <MaterialIcons name="check-circle" size={34} color="black" />
              <Text style={styles.touchText}>Closed</Text>
            </TouchableOpacity>
          </View>
        );

      case "main":
      default:
        const { label } = determineAction();
        return (
          <View style={styles.centerContainer}>
            <TouchableOpacity
              style={styles.touchIconBox}
              onPress={onActionPress}
              disabled={loading || label === "Closed"} // Disable when loading or already closed
            >
              <MaterialIcons name="touch-app" size={38} color="black" />
              <Text style={styles.touchText}>
                {loading ? "Processing…" : label}
              </Text>
            </TouchableOpacity>
          </View>
        );
    }
  }

  return renderCurrentView();
};

// Type definition for the attendance record
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

/**
 * Formats a Date object into "DD/MM/YYYY" string format.
 */
function formatDDMMYYYY(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// Stylesheet for the component
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" }, // Not directly used but good to keep
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  touchIconBox: {
    backgroundColor: "#FFFFFF",
    padding: 28,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    width: 130,
    shadowColor: "#FFFFFF",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    overflow: "hidden",
  },
  touchText: {
    marginTop: 10,
    fontSize: 16,
    color: "black",
    fontWeight: "bold",
  },
  lable: {
    fontSize: 18,
    backgroundColor: "#D32F2F",
  }
});

export default AttendanceFlow;
