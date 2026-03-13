import { EmployeeContext } from "../context/EmployeeContext";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    BackHandler,
    ImageBackground,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    ScrollView,
    Platform,
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [noCredentialChecked, setNoCredentialChecked] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
const [latitude, setLatitude] = useState("");
const [longitude, setLongitude] = useState("");
const [address, setAddress] = useState("");
const [radius, setRadius] = useState("");

  const router = useRouter();
  const { employee, setEmployee, logout } = useContext(EmployeeContext);
  
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true }
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => backHandler.remove();
    }, [])
  );
  
  useEffect(() => {
    setIsLoading(false);
  }, []);
// const handleGuestSubmit = async () => {
//   if (!firstName || !lastName || !newUsername || !newPassword || !email) {
//     Alert.alert("Error", "Please fill all fields");
//     return;
//   }

//   setIsSubmitting(true);
//   try {
//     const response = await fetch("https://${companyCode}.zentime.co.in/api/employees", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         firstName,
//         lastName,
//         username: newUsername,
//         password: newPassword,  // backend should hash this
//         email,
//         guestName: `${firstName} ${lastName}`,  // ✅ Full guest name
//         guestStartDate: new Date().toISOString(), // ✅ current datetime
//         companyCode: "ZenTime",   // ✅ fixed
//         clientId: 1,              // ✅ fixed
//         mobile: "",               // optional if backend requires
//         gender: "",               // optional
//         branch: "",               // optional
//         dob: null,                // optional
//         address: ""               // optional
//       }),
//     });

//     const result = await response.json();

//     if (response.ok) {
//       Alert.alert("Success", "Guest account created successfully");
//       setShowGuestModal(false);

//       // Clear form fields  
//       setFirstName("");
//       setLastName("");
//       setNewUsername("");
//       setNewPassword("");
//       setEmail("");
//     } else {
//       Alert.alert("Error", result.message || "Failed to create account");
//     }
//   } catch (err) {
//     console.error("Guest submit error:", err);
//     Alert.alert("Error", "Network error. Please try again.");
//   } finally {
//     setIsSubmitting(false);
//   }
// };
  
const handleGuestSubmit = async () => {
  if (!firstName || !lastName || !newUsername || !newPassword || !email || !latitude || !longitude || !address || !radius) {
    Alert.alert("Error", "Please fill all fields (including location)");
    return;
  }

  setIsSubmitting(true);
  try {
    // 1️⃣ Create Guest
    const response = await fetch(buildApiUrl("/api/employees"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        username: newUsername,
        password: newPassword,
        email,
        guestName: `${firstName} ${lastName}`,
        guestStartDate: new Date().toISOString(),
        companyCode: "iie",
        clientId: 1,
        mobile: "",
        gender: "",
        branch: "",
        dob: null,
        address: ""
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      Alert.alert("Error", result.message || "Failed to create account");
      return;
    }

    // 2️⃣ Create Location
    const locationResponse = await fetch(buildApiUrl("/api/locations"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        name: `${firstName} ${lastName}`, // guest’s name as location name
        address,
        radius: parseFloat(radius),
      }),
    });

    const locResult = await locationResponse.json();

    if (!locationResponse.ok) {
      Alert.alert("Warning", locResult.message || "Guest created but failed to save location");
    } else {
      Alert.alert("Success", "Guest account & location created successfully");
    }

    // 3️⃣ Clear form
    setShowGuestModal(false);
    setFirstName("");
    setLastName("");
    setNewUsername("");
    setNewPassword("");
    setEmail("");
    setLatitude("");
    setLongitude("");
    setAddress("");
    setRadius("");

  } catch (err) {
    console.error("Guest submit error:", err);
    Alert.alert("Error", "Network error. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};


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

      const data = await response.json();
      // console.log("Login API response:", data);

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
        if (!silent) showInvalidCredentialsAlert();
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
            setPassword(""); // Clear password field
            setMessage(""); // Clear any previous messages
          }
        }
      ]
    );
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
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
      resizeMode="cover">
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
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLogout}
            >
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

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => handleLogin()}
          >
            <Text style={styles.buttonText}>LOGIN</Text>
          </TouchableOpacity>
          
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => {
                setNoCredentialChecked(true);
                setShowContactModal(true);
              }}
            >
              <Text style={styles.checkboxIcon}>
                {noCredentialChecked ? "✓" : ""}
              </Text>
              <Text style={styles.checkboxLabel}>I don't have login credentials</Text>
            </TouchableOpacity>
          </View>

          {message ? (
            <Text style={[styles.message, { color: messageColor }]}>
              {message}
            </Text>
          ) : null}
        </View>
        )}
        
        {!employee && <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => setShowGuestModal(true)}
          >
            <Text style={styles.guestButtonText}>Guest Mode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clientRegButton}
            onPress={() => router.push("/ClientReg")}
          >
            <Text style={styles.clientRegButtonText}>Client Registration</Text>
          </TouchableOpacity>
        </View>}
      </ScrollView>

      {/* Contact Support Modal */}
      <Modal
        visible={showContactModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Need Access?</Text>
            <Text style={styles.modalText}>
              If you don't have login credentials, please contact:
            </Text>
            <Text style={styles.modalEmail}>wingrootechnologies@gmail.com</Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowContactModal(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Guest Account Modal */}
      <Modal
        visible={showGuestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isSubmitting && setShowGuestModal(false)}
      >
        <View style={styles.modalOverlays}>
          <ScrollView contentContainerStyle={styles.modalScrollContainer}>
            <View style={styles.guestModalContent}>
              <Text style={styles.modalTitle}>Create Guest Account</Text>

              <Text style={styles.label}>First Name*</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Last Name*</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                placeholderTextColor="#999"
              />
<Text style={styles.label}>Company Code</Text>
<TextInput
  style={[styles.input, { backgroundColor: "#f0f0f0" }]}
  value="iie"
  editable={false}
/>

<Text style={styles.label}>Client ID</Text>
<TextInput
  style={[styles.input, { backgroundColor: "#f0f0f0" }]}
  value="1"
  editable={false}
/>

              <Text style={styles.label}>Username*</Text>
              <TextInput
                style={styles.input}
                value={newUsername}
                onChangeText={setNewUsername}
                autoCapitalize="none"
                placeholder="Create username"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Password*</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  placeholder="Create password"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={toggleShowNewPassword}
                >
                  <Text style={styles.showPasswordText}>
                    {showNewPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Email*</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="Enter email"
                placeholderTextColor="#999"
              />
              <TextInput
  style={styles.input}
  value={latitude}
  onChangeText={setLatitude}
  keyboardType="numeric"
  placeholder="Enter latitude"
  placeholderTextColor="#999"
/>

<Text style={styles.label}>Longitude*</Text>
<TextInput
  style={styles.input}
  value={longitude}
  onChangeText={setLongitude}
  keyboardType="numeric"
  placeholder="Enter longitude"
  placeholderTextColor="#999"
/>

<Text style={styles.label}>Address*</Text>
<TextInput
  style={styles.input}
  value={address}
  onChangeText={setAddress}
  placeholder="Enter address"
  placeholderTextColor="#999"
/>

<Text style={styles.label}>Radius (meters)*</Text>
<TextInput
  style={styles.input}
  value={radius}
  onChangeText={setRadius}
  keyboardType="numeric"
  placeholder="Enter radius"
  placeholderTextColor="#999"

/>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.primaryButton]}
                  onPress={handleGuestSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.CreateAccountbuttonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#fff',
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
  CreateAccountbuttonText: {
    color: "white",
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
  bottomButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  guestButton: {
    padding: 14,
    borderRadius: 15,
    alignItems: "center",
    backgroundColor: "#351153",
    flex: 1,
    marginRight: 10,
  },
  guestButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  clientRegButton: {
    padding: 14,
    borderRadius: 15,
    alignItems: "center",
    backgroundColor: "#351153",
    flex: 1,
    marginLeft: 10,
  },
  clientRegButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
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
    color: '#333',
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
    color: '#333',
  },
  showPasswordButton: {
    padding: 14,
  },
  showPasswordText: {
    fontSize: 14,
    color: "#2a52be",
    fontWeight: '500',
  },
  message: {
    textAlign: "center",
    marginBottom: 15,
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxContainer: {
    marginTop: 10,
    alignItems: "flex-start",
    width: "100%",
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  checkboxIcon: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#2a52be",
    borderRadius: 4,
    marginRight: 8,
    textAlign: 'center',
    color: '#2a52be',
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#555",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  modalOverlays: {
    flex: 1,
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 15,
    color: '#555',
    lineHeight: 22,
  },
  modalEmail: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2a52be",
    textAlign: "center",
    marginBottom: 20,
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
  },
  guestModalContent: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#555",
    fontWeight: "bold",
  },
});

export default EmployeeLogin;
