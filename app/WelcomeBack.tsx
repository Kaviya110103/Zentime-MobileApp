import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground } from "react-native";
import { router } from "expo-router";
import { EmployeeContext } from "../context/EmployeeContext";

export default function WelcomeBack() {
  const { employee, logout } = useContext(EmployeeContext);

  if (!employee) {
    router.replace("/EmployeeLogin");
    return null;
  }

  const displayName =
    [employee.firstName ? String(employee.firstName) : "", employee.lastName ? String(employee.lastName) : ""]
      .join(" ")
      .trim() || employee.username || "Employee";

  const handleGoDashboard = () => {
    router.replace("/MarkAttendance");
  };

  const handleNotYou = async () => {
    await logout();
    router.replace("/EmployeeLogin");
  };

  return (
    <ImageBackground
      source={require("../assets/images/bg1.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{displayName}!</Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleGoDashboard}
          >
            <Text style={styles.buttonText}>Go to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleNotYou}
          >
            <Text style={styles.secondaryButtonText}>Not you? Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  welcomeBox: {
    backgroundColor: "#f9f9f9",
    padding: 30,
    width: "100%",
    maxWidth: 360,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 22,
    color: "#333",
    marginBottom: 10,
    fontWeight: "600",
  },
  welcomeName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#8f40d1ff",
    marginBottom: 30,
    textAlign: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#7c25c4ff",
    padding: 14,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    padding: 14,
    borderRadius: 15,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#7c25c4ff",
    marginBottom: 15,
  },
  secondaryButtonText: {
    color: "#7c25c4ff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
