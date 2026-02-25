import DateTimePicker from '@react-native-community/datetimepicker';
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
// import { Calendar, CircleCheck as CheckCircle, Clock, FileText, Send } from 'lucide-react-native';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import React, { useContext, useEffect, useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
  SafeAreaView
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import BottomNavBar from "../components/BottomNavBar";
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { EmployeeContext } from "../context/EmployeeContext";

const LeavePermission = () => {

  const router = useRouter();
const { employeeId } = useLocalSearchParams();
const { employee, setEmployee, logout } = useContext(EmployeeContext);
const companyCode = employee?.companyCode;  // 👈 get companyCode here
  // const employeeId = employee?.id;
  const [leaveType, setLeaveType] = useState(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

useEffect(() => {
  if (!employeeId) {
    Alert.alert("Error", "Employee ID is missing.");
      router.replace("/EmployeeLogin"); // Redirect user to login
  }
}, [employeeId]);

  const [openDropdown, setOpenDropdown] = useState(false);
  const [leaveItems, setLeaveItems] = useState([
    { label: "🤒 Sick Leave", value: "Sick Leave" },
    { label: "🏖️ Casual Leave", value: "Casual Leave" },
    { label: "👶 Maternity Leave", value: "Maternity Leave" },
    { label: "💒 Marriage Leave", value: "Marriage Leave" },
  ]);

  const formatDate = (date: Date) => {
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const getDaysBetween = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async () => {
    if (!employeeId) {
      Alert.alert("Missing Employee", "Employee ID is missing. Please login again or contact admin.");
      return;
    }
    if (!leaveType || !startDate || !endDate) {
      Alert.alert("Missing Information", "Please fill all required fields marked with *");
      return;
    }
    if (endDate < startDate) {
      Alert.alert("Invalid Dates", "End date cannot be before start date");
      return;
    }

    setIsSubmitting(true);

    const formData = {
      leaveType,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      reason,
      date: formatDate(startDate),
    };

    try {
      await axios.post(
  `http://192.168.1.15:8080/api/leaves/create?employeeId=${employeeId}`,
  formData
);

      Alert.alert(
        "Success! 🎉",
        "Your leave request has been submitted successfully and is now pending approval.",
        [{ text: "OK", style: "default" }]
      );

      // Reset form
      setLeaveType(null);
      setStartDate(null);
      setEndDate(null);
      setReason("");
    } catch (error) {
      console.error("Error submitting form:", error);
      Alert.alert(
        "Submission Failed",
        "Unable to submit your request. Please check your connection and try again.",
        [{ text: "Retry", style: "default" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
     <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.mainContainer}>
          {/* Header */}
          <LinearGradient
            colors={['#7726B9', '#351153']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.headerTitle}>Leave Request</Text>
          </LinearGradient>

          {/* DropDownPicker outside ScrollView (IMPORTANT) */}
          <View style={[styles.card, { zIndex: 2000 }]}>
            <View style={styles.cardHeader}>
      <Feather name="file-text" size={25} color="black" />
              <Text style={styles.cardTitle}>Leave Type</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <DropDownPicker
              open={openDropdown}
              value={leaveType}
              items={leaveItems}
              setOpen={setOpenDropdown}
              setValue={setLeaveType}
              setItems={setLeaveItems}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              placeholder="Choose your leave type"
              placeholderStyle={styles.placeholderStyle}
              textStyle={styles.dropdownText}
              listMode="SCROLLVIEW" // Prevent VirtualizedList nesting
            />
          </View>

          {/* Scrollable content */}
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Employee ID Warning */}
            {(!employeeId ) && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Employee ID is missing. Please login again or contact admin.
                </Text>
              </View>
            )}

            {/* Date Pickers */}
            <View style={styles.dateRow}>
              {/* Start Date */}
              <View style={[styles.card, styles.dateCard]}>
                <View style={styles.cardHeader}>
<MaterialCommunityIcons name="calendar" size={25} color="purple" />
                  <Text style={styles.cardTitle}>Start Date</Text>
                  <Text style={styles.required}>*</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  style={styles.dateButton}
                >
                  <Text style={[styles.dateText, startDate && styles.dateTextSelected]}>
                    {startDate ? formatDate(startDate) : "Select date"}
                  </Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "spinner"}
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowStartPicker(false);
                      if (selectedDate) setStartDate(selectedDate);
                    }}
                  />
                )}
              </View>

              {/* End Date */}
              <View style={[styles.card, styles.dateCard]}>
                <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="calendar" size={25} color="purple" />
                  <Text style={styles.cardTitle}>End Date</Text>
                  <Text style={styles.required}>*</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowEndPicker(true)}
                  style={styles.dateButton}
                >
                  <Text style={[styles.dateText, endDate && styles.dateTextSelected]}>
                    {endDate ? formatDate(endDate) : "Select date"}
                  </Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={endDate || startDate || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "spinner"}
                    minimumDate={startDate || new Date()}
                    onChange={(event, selectedDate) => {
                      setShowEndPicker(false);
                      if (selectedDate) setEndDate(selectedDate);
                    }}
                  />
                )}
              </View>
            </View>

            {/* Duration */}
            {startDate && endDate && (
              <View style={styles.durationCard}>
                      <Feather name="clock" size={25} color="blue" />

                <Text style={styles.durationText}>
                  Duration: {getDaysBetween(startDate, endDate)} day{getDaysBetween(startDate, endDate) > 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {/* Reason */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                 <Feather name="file-text" size={25} color="black" />
                <Text style={styles.cardTitle}>Reason</Text>
                <Text style={styles.optional}>(Optional)</Text>
              </View>
              <TextInput
                style={styles.textArea}
                value={reason}
                onChangeText={setReason}
                placeholder="Describe the reason for your leave request..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>{reason.length}/500</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : ['#7726B9', '#351153']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSubmitting ? (
                  <Text style={styles.submitText}>Submitting...</Text>
                  
                ) : (
                  <>
                          <Feather name="send" size={25} color="white" />

                    <Text style={styles.submitText}>Submit Request</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Help */}
            <View style={styles.helpCard}>
              <Feather name="check-circle" size={25} color="green" />
              <Text style={styles.helpText}>
                Your request will be reviewed by Admin and you'll receive a notification once approved.
              </Text>
            </View>
          </ScrollView>

          {/* Bottom nav */}
          <BottomNavBar activeTab="Leave" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    marginTop: 13,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  container: {
    padding: 15,
    paddingTop: 25,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEEBA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  warningText: {
    color: '#856404',
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    marginTop:20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  required: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optional: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
  },
  dropdown: {
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
    minHeight: 50,
  },
  dropdownContainer: {
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  placeholderStyle: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  dropdownText: {
    color: '#1F2937',
    fontSize: 15,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateCard: {
    flex: 1,
  },
  dateButton: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 15,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  dateTextSelected: {
    color: '#1F2937',
    fontWeight: '500',
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  durationText: {
    fontSize: 15,
    color: '#7726B9',
    fontWeight: '600',
    marginLeft: 8,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#7726B9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    shadowOpacity: 0.1,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F0FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8B4FE',
    marginBottom: 60,

  },
  helpText: {
    fontSize: 12,
    color: '#7726B9',
    marginLeft: 8,
    flex: 1,
    lineHeight:20 }
  });

  export default LeavePermission;

