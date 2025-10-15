import DateTimePicker from '@react-native-community/datetimepicker';
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
// import { Calendar, CircleCheck as CheckCircle, Clock, FileText, Send } from 'lucide-react-native';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import React, { useContext, useState } from "react";
import {
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
// import EmployeeLeavePermission from "@/components/EmployeeLeavePermission";
import BottomNavBar from "../components/BottomNavBar";

const { width } = Dimensions.get('window');

// const EmployeePermission = () => {
//   const route = useRoute<RouteProp<RootStackParamList, 'EmployeePermission'>>();
//   const { employeeId } = route.params;
import { EmployeeContext } from "../context/EmployeeContext";
import { router, useLocalSearchParams } from 'expo-router';

const EmployeePermission = () => {
   const { recordId } = useLocalSearchParams();
 const {  employee, setEmployee } = useContext(EmployeeContext);
  const employeeId = employee?.id;
  const [leaveType] = useState("permission");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
const companyCode = employee?.companyCode;
  const [showDatePicker, setShowDatePicker] = useState({ start: false, end: false });
  const [showTimePicker, setShowTimePicker] = useState({ start: false, end: false });

  const formatDate = (date: Date) => {
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const formatTime = (date: Date) => {
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()).padStart(2, "0")}`;
  };

  const getTimeDifference = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const handleSubmit = async () => {
    if (!leaveType || !startDate || !endDate || !startTime || !endTime) {
      Alert.alert("Missing Information", "Please fill all required fields marked with *");
      return;
    }

    if (endTime <= startTime) {
      Alert.alert("Invalid Time", "End time must be after start time");
      return;
    }

    setIsSubmitting(true);

    const formData = {
      leaveType,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      reason,
      date: formatDate(startDate),
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
    };

   try {
  await axios.post(
    `https://${companyCode}.iieawstesting.in/api/leaves/create?employeeId=${employeeId}`,
    formData
  );

  Alert.alert(
    "Success! 🎉",
    "Your permission request has been submitted successfully and is now pending approval.",
    [
      {
        text: "OK",
        onPress: () => {
          if (recordId) {
            router.push(`/MarkTimeOut?recordId=${recordId}`);
          }
        },
      },
    ]
  );

  // Reset form
  setReason("");
  setStartDate(null);
  setEndDate(null);
  setStartTime(null);
  setEndTime(null);
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
    <View style={styles.mainContainer}>
      {/* Header */}
      <LinearGradient
        colors={['#7726B9', '#5E1D9E']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Permission Request</Text>
        {/* <Text style={styles.headerSubtitle}>Submit your time-off permission</Text> */}
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {/* Start Date Row */}
        <View style={styles.inputRow}>
     <MaterialCommunityIcons name="calendar" size={30} color="purple" />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Start Date <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker({ ...showDatePicker, start: true })}
              style={styles.inputField}
            >
              <Text style={[styles.inputText, startDate && styles.selectedText]}>
                {startDate ? formatDate(startDate) : "Select date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker.start && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker({ ...showDatePicker, start: false });
                  if (selectedDate) {
                    setStartDate(selectedDate);
                    setEndDate(selectedDate);
                  }
                }}
              />
            )}
          </View>
        </View>

        {/* End Date Row (Auto-filled) */}
        <View style={styles.inputRow}>
             <MaterialCommunityIcons name="calendar" size={30} color="purple" />
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: '#9CA3AF' }]}>End Date <Text style={styles.autoFilled}>(Auto)</Text></Text>
            <View style={[styles.inputField, styles.disabledField]}>
              <Text style={[styles.inputText, { color: '#9CA3AF' }]}>
                {endDate ? formatDate(endDate) : "Same as start date"}
              </Text>
            </View>
          </View>
        </View>

        {/* Start Time Row */}
        <View style={styles.inputRow}>
            <Feather name="clock" size={30} color="purple" />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Start Time <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker({ ...showTimePicker, start: true })}
              style={styles.inputField}
            >
              <Text style={[styles.inputText, startTime && styles.selectedText]}>
                {startTime ? formatTime(startTime) : "Select time"}
              </Text>
            </TouchableOpacity>
            {showTimePicker.start && (
              <DateTimePicker
                value={startTime || new Date()}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker({ ...showTimePicker, start: false });
                  if (selectedTime) setStartTime(selectedTime);
                }}
              />
            )}
          </View>
        </View>

        {/* End Time Row */}








        <View style={styles.inputRow}>
            <Feather name="clock" size={30} color="purple" />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>End Time <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              onPress={() => setShowTimePicker({ ...showTimePicker, end: true })}
              style={styles.inputField}
            >
              <Text style={[styles.inputText, endTime && styles.selectedText]}>
                {endTime ? formatTime(endTime) : "Select time"}
              </Text>
            </TouchableOpacity>
            {showTimePicker.end && (
              <DateTimePicker
                value={endTime || new Date()}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker({ ...showTimePicker, end: false });
                  if (selectedTime) setEndTime(selectedTime);
                }}
              />
            )}
          </View>
        </View>

        {/* Duration Display */}
        {startTime && endTime && (
          <View style={styles.durationRow}>
            <View style={styles.iconContainer}>
              <Feather name="clock" size={30} color="blue" />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.durationText}>
                Duration: {getTimeDifference(startTime, endTime)}
              </Text>
            </View>
          </View>
        )}


        {/* Reason Row */}
        <View style={styles.inputRow}>
             <Feather name="file-text" size={30} color="purple" />
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Reason <Text style={styles.optional}>(Optional)</Text>  <Text style={styles.characterCount}>{reason.length}/500</Text>
</Text>

            <TextInput
              style={[styles.inputField, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Describe the reason for your permission request..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : ['#7726B9', '#5E1D9E']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <Text style={styles.submitText}>Submitting...</Text>
            ) : (
              <>
               <Feather name="send" size={30} color="white" />
                <Text style={styles.submitText}>Submit Request</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpRow}>
                 <Feather name="check-circle" size={30} color="green" />

          <View style={styles.inputContainer}>
            <Text style={styles.helpText}>
              Your permission request will be reviewed by HR and you'll receive a notification once approved.
            </Text>
          </View>
          
        </View>
         {/* <EmployeeLeavePermission employeeId={employeeId} /> */}
          

      </ScrollView>
       <View style={{ flex: 1, paddingBottom: 80 }}>
  {/* Your page content here */}
  <BottomNavBar activeTab="Permission" />
</View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    marginTop:0 ,
    backgroundColor: '#ffffff',
  },
  header: {
    
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    color: '#ffffff',
    opacity: 0.9,
  },
  container: {
    padding: 10,
    paddingTop: 28,
marginBottom: 100, },

  inputRow: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  durationRow: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'center',
    backgroundColor: '#F5F0FF',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  helpRow: {
    flexDirection: 'row',
    // marginBottom: 20,
    alignItems: 'flex-start',
    backgroundColor: '#F5F3FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    paddingTop: 0,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
  optional: {
    color: '#9CA3AF',
    fontSize: 12,
    fontStyle: 'italic',
  },
  autoFilled: {
    color: '#7726B9',
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  inputField: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#F9FAFB',
  },
  disabledField: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  inputText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  selectedText: {
    color: '#1F2937',
    fontWeight: '500',
  },
  durationText: {
    fontSize: 14,
    color: '#7726B9',
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 7,
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
    padding: 15,
    gap: 8,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: '#7726B9',
    lineHeight: 20,
  },
});

export default EmployeePermission;