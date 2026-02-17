import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import LocationTest from '../app/LocationTest';
import { isToday, parse } from "date-fns";
import { EmployeeContext } from "../context/EmployeeContext";

interface StartDayProps {
  employeeId: number;
  onDone?: () => void;
  onCancel?: () => void;
}

export default function StartDayComponent({ employeeId, onDone, onCancel }: StartDayProps) {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dayStarted, setDayStarted] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [canStartDay, setCanStartDay] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [showTimeoutReasonModal, setShowTimeoutReasonModal] = useState(false);
  const [timeoutReason, setTimeoutReason] = useState('');
  const [missedTimeoutRecordId, setMissedTimeoutRecordId] = useState<number | null>(null);
  const [pendingLocation, setPendingLocation] = useState<string | null>(null);
  const { employee } = useContext(EmployeeContext);
  const companyCode = employee?.companyCode;

  useEffect(() => {
    const fetchAttendanceStatus = async () => {
      try {
        const res = await axios.get(
          `https://${companyCode}.zentime.co.in/api/attendance/latest-today-or-yesterday/${employeeId}`
        );
        const data = res.data;
        if (data?.date) {
          const parsedDate = parse(data.date, 'dd/MM/yyyy', new Date());
          const today = isToday(parsedDate);
          if (today && data.attendanceStatus === 'Absent') {
            setAttendanceStatus('Absent');
          } else if (today && data.timeIn) {
            setDayStarted(true);
            // If day already started, notify parent
            onDone?.();
          }
        }
      } catch (error) {
        console.log("No attendance record found");
      } finally {
        setInitialLoading(false);
      }
    };
    
    if (employeeId && companyCode) {
      fetchAttendanceStatus();
    }
  }, [employeeId, companyCode]);

  const isAbsentToday = attendanceStatus === 'Absent';

  const handleStartDayFlow = () => {
    if (isAbsentToday || dayStarted) return;
    setShowLocationModal(true);
  };

  const handleStartDay = async (locationOverride?: string) => {
    if (!currentAddress && !locationOverride) {
      Alert.alert("Error", "Location not detected. Please wait or try again.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `https://${companyCode}.zentime.co.in/api/attendance/start-day`,
        null,
        {
          params: {
            employeeId,
            location: locationOverride ?? currentAddress
          }
        }
      );
      
      Alert.alert("Success", res.data || "Day started successfully");
      setDayStarted(true);
      setShowLocationModal(false);
      
      // Small delay to ensure state updates
      setTimeout(() => {
        onDone?.();
      }, 100);
      
    } catch (err: any) {
      const errorData = err?.response?.data;
      
      if (errorData?.missedTimeoutRecordId) {
        setMissedTimeoutRecordId(errorData.missedTimeoutRecordId);
        setShowTimeoutReasonModal(true);
        setShowLocationModal(false);
        setPendingLocation(locationOverride ?? currentAddress);
      } else {
        const message = typeof errorData === 'string' ? errorData : 
                       errorData?.message || "Failed to start day.";
        Alert.alert("Alert", message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTimeoutReason = async () => {
    if (!missedTimeoutRecordId) {
      Alert.alert("Error", "Invalid record");
      return;
    }
    
    if (!timeoutReason.trim()) {
      Alert.alert("Error", "Please enter a reason");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `https://${companyCode}.zentime.co.in/api/attendance/submit-timeout-reason`,
        null,
        {
          params: {
            recordId: missedTimeoutRecordId,
            reason: timeoutReason.trim()
          }
        }
      );
      
      Alert.alert("Success", "Reason submitted successfully");
      setShowTimeoutReasonModal(false);
      setTimeoutReason('');
      setMissedTimeoutRecordId(null);
      
      if (pendingLocation) {
        await handleStartDay(pendingLocation);
        setPendingLocation(null);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || "Submission failed";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationStatus = (status: 'Active' | 'Inactive' | 'Unknown') => {
    setCanStartDay(status === 'Active');
  };

  if (initialLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#351153" />
      </View>
    );
  }

  if (dayStarted) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.centerContainer}>
        <TouchableOpacity
          style={[
            styles.touchIconBox,
            (isAbsentToday || loading) && styles.disabledContainer
          ]}
          onPress={handleStartDayFlow}
          disabled={loading || isAbsentToday}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#351153" />
          ) : (
            <>
              <MaterialIcons 
                name={isAbsentToday ? "hotel" : "wb-sunny"} 
                size={38} 
                color={isAbsentToday ? "#9CA3AF" : "#351153"} 
              />
              <Text style={[
                styles.dayStartText,
                isAbsentToday && styles.disabledText
              ]}>
                {isAbsentToday ? 'Take Rest' : 'Start Day'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Start Day Location Modal */}
      <Modal visible={showLocationModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mapContainer}>
            <LocationTest
              onStatusChange={handleLocationStatus}
              onAddressChange={setCurrentAddress}
              inModal
            />
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.confirmButton, (!canStartDay || loading) && styles.disabledButton]}
              onPress={() => handleStartDay()}
              disabled={!canStartDay || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Confirm Start Day</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Timeout Reason Modal */}
      <Modal visible={showTimeoutReasonModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowTimeoutReasonModal(false);
                setPendingLocation(null);
              }}>
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Timeout Reason Required</Text>
              <Text style={styles.modalSubtitle}>
                Your previous work session timed out. Please provide a reason.
              </Text>
              
              <TextInput
                style={styles.reasonInput}
                multiline
                numberOfLines={4}
                placeholder="Enter reason..."
                value={timeoutReason}
                onChangeText={setTimeoutReason}
                editable={!loading}
              />
              
              <TouchableOpacity
                style={[styles.confirmButton, (!timeoutReason.trim() || loading) && styles.disabledButton]}
                onPress={handleSubmitTimeoutReason}
                disabled={!timeoutReason.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Submit Reason</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
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
  dayStartText: {
    fontSize: 16,
    color: "#351153",
    marginTop: 8,
    fontWeight: "600",
  },
  disabledContainer: {
    opacity: 0.7,
    backgroundColor: "#F3F4F6",
  },
  disabledText: {
    color: "#9CA3AF",
  },
  cancelButton: {
    marginTop: 16,
    padding: 8,
  },
  cancelText: {
    color: "#6B7280",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  mapContainer: {
    flex: 1,
    minHeight: 400,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalScroll: {
    flexGrow: 1,
  },
  modalContent: {
    padding: 16,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    marginBottom: 20,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#351153',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});