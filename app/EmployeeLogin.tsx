import { EmployeeContext } from "../context/EmployeeContext";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { buildApiUrl } from "../lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EmployeeLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("#4CAF50");
  const [isLoading, setIsLoading] = useState(false);
  const [companyCode, setCompanyCode] = useState("");

  const router = useRouter();
  const { employee, setEmployee, logout } = useContext(EmployeeContext);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Exit", onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true }
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => backHandler.remove();
    }, [])
  );

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleLogin = async (
    inputUsername?: string,
    inputPassword?: string,
    silent?: boolean
  ) => {
    const uname = inputUsername ?? username;
    const pwd = inputPassword ?? password;
    const normalizedCompanyCode = companyCode.trim().toLowerCase();

    if (!uname.trim() || !pwd.trim()) {
      if (!silent) {
        Alert.alert("Error", "Please enter both username and password");
      }
      return;
    }

    if (!normalizedCompanyCode) {
      if (!silent) {
        Alert.alert("Error", "Please enter company code");
      }
      return;
    }

    try {
      const pushToken = await AsyncStorage.getItem("expoPushToken");
      const response = await fetch(buildApiUrl(`/api/employees/login`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: uname.trim(),
          password: pwd,
          companyCode: normalizedCompanyCode,
          pushToken: pushToken || undefined,
        }),
      });

      const rawText = await response.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (response.ok) {
        if (data && data.id) {
          await setEmployee(data);
          setMessage("Login successful!");
          setMessageColor("#4CAF50");
          router.replace("/WelcomeBack");
        } else {
          if (!silent) showInvalidCredentialsAlert();
        }
      } else {
        if (!silent) {
          if (response.status === 401) {
            showInvalidCredentialsAlert();
          } else {
            const backendMessage =
              (data && (data.error || data.message)) ||
              `Login failed (HTTP ${response.status})`;
            Alert.alert("Login Failed", String(backendMessage));
          }
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      if (!silent) {
        Alert.alert("Error", "Network error. Please check your connection.");
      }
    }
  };

  const showInvalidCredentialsAlert = () => {
    Alert.alert(
      "Invalid Credentials",
      "The username or password you entered is incorrect. Please try again.",
      [
        {
          text: "OK",
          onPress: () => {
            setPassword("");
            setMessage("");
          },
        },
      ]
    );
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogout = async () => {
    await logout();
    setUsername("");
    setPassword("");
    setMessage("");
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, styles.whiteBackground]}>
        <ActivityIndicator size="large" color="#085469" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/images/bg1.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.heading}>Employee Login</Text>
        {employee ? (
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.welcomeName}>
              {employee.name || employee.username || "Employee"}
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.replace("/MarkAttendance")}
            >
              <Text style={styles.buttonText}>Go to Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
              <Text style={styles.secondaryButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginBox}>
            <Text style={styles.label}>Username*</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="Enter your username"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Password*</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={toggleShowPassword}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>CompanyCode*</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={companyCode}
                onChangeText={setCompanyCode}
                placeholder="Enter your companycode"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={() => handleLogin()}>
              <Text style={styles.buttonText}>LOGIN</Text>
            </TouchableOpacity>

            {message ? (
              <Text style={[styles.message, { color: messageColor }]}>{message}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  whiteBackground: {
    backgroundColor: "transparent",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 28,
    color: "#ffffff",
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  loginBox: {
    backgroundColor: "#ffffff",
    padding: 25,
    borderRadius: 25,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  welcomeBox: {
    backgroundColor: "#f9f9f9",
    padding: 30,
    width: "100%",
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
  primaryButton: {
    backgroundColor: "#351153",
    padding: 16,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: "white",
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
    fontSize: 16,
    fontWeight: "500",
  },
  label: {
    color: "#555",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: 14,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#fff",
    color: "#333",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: "#333",
  },
  showPasswordButton: {
    padding: 14,
  },
  showPasswordText: {
    fontSize: 14,
    color: "#2a52be",
    fontWeight: "500",
  },
  message: {
    textAlign: "center",
    marginBottom: 15,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default EmployeeLogin;
