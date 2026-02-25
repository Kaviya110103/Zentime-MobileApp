// DayCloseComponent.tsx
// import type { RootStackParamList } from "../types"; // adjust import path
import { MaterialIcons } from "@expo/vector-icons";
// import { RouteProp, useNavigation } from "@react-navigation/native";
import axios from "axios";
// import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { NativeStackNavigationProp } from "react-native-screens/lib/typescript/native-stack/types";
import { router } from 'expo-router';
import { EmployeeContext } from "../context/EmployeeContext";

interface DayCloseProps {
  recordId: number;
  onDone?: () => void;
}

export default function DayCloseComponent({
  recordId,
  onDone
}: DayCloseProps) {
  const [loading, setLoading] = useState(false);
    // const navigation = useNavigation<MarkTimeInNavigationProp>();
    const {  employee, setEmployee } = useContext(EmployeeContext);
    const companyCode = employee?.companyCode;

  const handleDayClose = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `http://192.168.1.15:8080/api/attendance/update-day-status`,
        null,
        {
          params: {
            recordId,
            dayStatus: "Completed"
          }
        }
      );
      Alert.alert("Success", res.data);
  // router.push(`/MarkTimeIn?recordId=${recordId}`);
      onDone?.();
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

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          {/* <TouchableOpacity
            style={styles.button}
            onPress={handleDayClose}
          >
            <Text style={styles.buttonText}>Close Day</Text>
          </TouchableOpacity> */}
            <View style={styles.centerContainer}>
            <TouchableOpacity
  style={styles.touchIconBox}
  onPress={handleDayClose}
  disabled={loading}
>
  <MaterialIcons name="touch-app" size={38} color="black" />
  <Text style={styles.dayCloseText}>Confirm</Text>
</TouchableOpacity>


            {/* {missing.length > 0 && (
              <Text style={styles.missing}>Missing: {missing.join(", ")}</Text>
            )} */}
          </View>
          {/* <Text style={styles.info}>Record ID: {recordId}</Text> */}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  button: {
    backgroundColor: "#D32F2F",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600"
  },
  info: {
    fontSize: 14,
    color: "#555"
  },
 
 touchIconBox: {
  backgroundColor: "#FFFFFF", // White background
  padding: 28,
  borderRadius: 25, // More rounded corners
  alignItems: "center",
  justifyContent: "center",
  width: 130,
  // Shadow for glowing effect
  shadowColor: "#FFFFFF", // White glow
  shadowOffset: {
    width: 0,
    height: 0,
  },
  shadowOpacity: 0.8, // Stronger opacity for glow
  shadowRadius: 10, // Larger radius for softer glow
  elevation: 10, // For Android
  // Border for subtle definition
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.5)", // Semi-transparent white
  // Touch feedback effect
  overflow: "hidden", // For ripple effect containment
},
   centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  touchText: { marginTop: 10, fontSize: 16, color: "black" },
  dayCloseText: {
    marginTop: 10,
    fontSize: 18,
    color: "black",
    fontWeight: "bold",
    textAlign: "center"
  },
});
function useContext(EmployeeContext: any): { employee: any; setEmployee: any; } {
  throw new Error("Function not implemented.");
}


