import BottomNavBar from "../components/BottomNavBar";
// import { EmployeeTestNavProps } from "../types";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { EmployeeContext } from "../context/EmployeeContext";
import axios from "axios";

const { width, height } = Dimensions.get("window");
const isDesktop = width >= 768;

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  gender: string;
  position: string;
  branch: string;
  username: string;
  password: string;
  dob: string;
  email: string;
  profileImage: string | null;
  address: string;
  alternativeMobile: string;
  dateOfJoining: string;
  resetToken: string | null;
  salary: number | null;
  weekOff: string | null;
  clientId: number;
  companyCode: string;
  
}

const Employee = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
//const {  employee, setEmployee } = useContext(EmployeeContext);
//const clientId = employee?.clientId;
// const companyCode = employee?.companyCode; 
  // const navigation = useNavigation<EmployeeTestNavProps>();
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  // const { logout } = useContext(EmployeeContext);
  const [client, setClient] = useState<any>(null);
const { employee, setEmployee, logout } = useContext(EmployeeContext);
const companyCode = employee?.companyCode;  // 👈 get companyCode here
  const employeeId = employee?.id;

    useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeId) return;

      try {
const response = await fetch(`https://${companyCode}.zentime.co.in/api/employees/${employeeId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setEmployee(data);
        setFormData(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        Alert.alert("Error", "Failed to fetch employee data");
      }
    };

    // Only fetch data if not editing to prevent interference
    if (!isEditing) {
      fetchEmployeeData();
    }
  }, [employeeId, isEditing, setEmployee]);
//   useEffect(() => {
//     const fetchClient = async () => {
//       try {
// const res = await axios.get(`https://${employee.companyCode}.zentime.co.in/api/clients/${employee.clientId}`);
//         setClient(res.data);
//       } catch (err) {
//         console.error(err);
//         Alert.alert('Unable to fetch client details');
//       }
//     };

//     if (employee.clientId) fetchClient();
//   }, [employee.clientId]);


   const handleLogout = async () => {
    await logout();
    router.push("/");
  };
  const handleInputChange = useCallback((field: keyof Employee, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === "salary" ? (value === "" ? null : Number(value)) : value
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!employeeId) return;

    try {
const response = await fetch(`https://${companyCode}.zentime.co.in/api/employees/update/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const updatedEmployee = await response.json();
      setEmployee(updatedEmployee);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (err) {
      Alert.alert("Error", "Failed to update profile");
      console.error("Update error:", err);
    }
  }, [employeeId, formData, setEmployee]);

  const toggleEditMode = useCallback(() => {
    if (!isEditing) {
      // When entering edit mode, ensure formData is current
setFormData(employee as unknown as Partial<Employee>);
    }
    setIsEditing(!isEditing);
    setMenuVisible(false);
  }, [isEditing, employee]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
setFormData(employee as unknown as Partial<Employee>);
  }, [employee]);

//   const pickImageAndUpload = useCallback(async () => {
//     // Request permission
//     const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permissionResult.granted) {
//       alert('Permission to access gallery is required!');
//       return;
//     }

//     // Pick image
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       quality: 1,
//     });

//     if (!result.canceled && result.assets.length > 0) {
//       const selectedAsset = result.assets[0];
//       setImageUri(selectedAsset.uri);

//       // Upload image URL to backend
//       try {
// const response = await fetch(`https://${companyCode}.zentime.co.in/api/employees/${employeeId}/profile-image`, {

//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/x-www-form-urlencoded',
//           },
//           body: `imageUrl=${encodeURIComponent(selectedAsset.uri)}`,
//         });

//         if (response.ok) {
//           alert('Image uploaded successfully!');
//           // Refresh the employee data
//           const updatedResponse = await fetch(`https://${companyCode}.zentime.co.in/api/employees/${employeeId}`);
//           if (updatedResponse.ok) {
//             const updatedData = await updatedResponse.json();
//             setEmployee(updatedData);
//             setFormData(updatedData);
//           }
//         } else {
//           alert('Failed to upload image.');
//         }
//       } catch (err) {
//         console.error(err);
//         alert('An error occurred during upload.');
//       }
//     }
//   }, [employeeId, setEmployee]);
const pickImageAndUpload = useCallback(async () => {
  // Request permission
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    alert("Permission to access gallery is required!");
    return;
  }

  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });

  if (!result.canceled && result.assets.length > 0) {
    const selectedAsset = result.assets[0];
    setImageUri(selectedAsset.uri);

    try {
      const response = await fetch(
        `https://${companyCode}.zentime.co.in/api/employees/${employeeId}/profile-image`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `imageUrl=${encodeURIComponent(selectedAsset.uri)}`,
        }
      );

      if (response.ok) {
        alert("Image uploaded successfully!");

        // Refresh employee data
        const updatedResponse = await fetch(
          `https://${companyCode}.zentime.co.in/api/employees/${employeeId}`
        );
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          setEmployee(updatedData);
          setFormData(updatedData);
        }

        // ✅ Navigate to EmployeeProfile
        router.push("/EmployeeProfile");
      } else {
        alert("Failed to upload image.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during upload.");
    }
  }
}, [employeeId, companyCode, setEmployee, setFormData]);

  const ProfileSection = useMemo(() => 
    React.memo<{ title: string; children: React.ReactNode }>(({ title, children }) => (
      <View style={[styles.section, isDesktop && styles.desktopSection]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>{children}</View>
      </View>
    )), [isDesktop]
  );

  const InfoRow = useMemo(() => 
    React.memo<{ icon: React.ReactNode; label: string; value: string | number }>(({
      icon,
      label,
      value,
    }) => (
      <View style={styles.infoRow}>
        <View style={styles.infoLabel}>
          {icon}
          <Text style={styles.infoLabelText}>{label}</Text>
        </View>
        <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </Text>
      </View>
    )), []
  );

  const EditableInfoRow = useMemo(() => 
    React.memo<{
      icon: React.ReactNode;
      label: string;
      field: keyof Employee;
      value: string | number | null;
      keyboardType?: string;
      onChangeText: (field: keyof Employee, value: string) => void;
    }>(({ icon, label, field, value, keyboardType = "default", onChangeText }) => {
      return (
        <View style={styles.editableInfoRow}>
          <View style={styles.infoLabel}>
            {icon}
            <Text style={styles.infoLabelText}>{label}</Text>
          </View>
          <TextInput
            style={styles.editInput}
            value={value === null ? "" : String(value)}
            onChangeText={(text) => onChangeText(field, text)}
            keyboardType={keyboardType as any}
            placeholder={`Enter ${label.toLowerCase()}`}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      );
    }), []
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error || !employee) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || "No employee data found"}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#ffffff", "#f8fafc"]} style={styles.background}>
        {/* Header */}
        {/* <View style={[styles.header, isDesktop && styles.desktopHeader]}>
          <Text style={styles.headerTitle}>Employee rofile</Text>
        
        </View> */}

        {/* Menu Modal */}
            <LinearGradient
                      colors={['#7726B9', '#5E1D9E']}
                      style={styles.header}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.headerTitle}>Employee Profile</Text>
                      {/* <Text style={styles.headerSubtitle}>Submit your time-off permission</Text> */}
                        <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu" size={24} color="#ffffff" />
          </TouchableOpacity>

                    </LinearGradient>
        <Modal
          animationType="fade"
          transparent={true}
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View style={[styles.modalContainer, isDesktop && styles.desktopModalContainer]}>
              <View style={[styles.modalContent, isDesktop && styles.desktopModalContent]}>
                <TouchableOpacity style={styles.menuItem} onPress={toggleEditMode}>
                  <Ionicons name={isEditing ? "close" : "create"} size={20} color="#334155" />
                  <Text style={styles.menuItemText}>
                    {isEditing ? "Cancel Editing" : "Edit Profile"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.replace("/MarkAttendance")}>
                  <Ionicons name="calendar" size={20} color="#334155" />
                  <Text style={styles.menuItemText}>Mark Attendance</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.menuItem, styles.logoutMenuItem]} onPress={handleLogout}>
                  <Ionicons name="log-out" size={20} color="#ef4444" />
                  <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image Section */}
          <View style={styles.profileImageSection}>
            <View style={styles.profileImageContainer}>
   <Image
  source={{ uri: employee.profileImage }}
  style={{
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0'
  }}
/>
              {isEditing && (
                <TouchableOpacity style={styles.editImageButton} onPress={pickImageAndUpload}>
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.employeeName}>
                {employee.firstName} {employee.lastName}
              </Text>
              <Text style={styles.employeePosition}>{employee.position}</Text>
              {/* <Text style={styles.employeeBranch}>{client.companyName}</Text>
               <Text style={styles.employeeBranch}>{companyCode}</Text> */}

            </View>
          </View>

          {/* Personal Information */}
          <ProfileSection title="Personal Information">
            {isEditing ? (
              <>
                <EditableInfoRow
                  icon={<Ionicons name="person" size={18} color="#64748b" />}
                  label="First Name"
                  field="firstName"
                  value={formData.firstName || ""}
                  onChangeText={handleInputChange}
                />
                <EditableInfoRow
                  icon={<Ionicons name="person" size={18} color="#64748b" />}
                  label="Last Name"
                  field="lastName"
                  value={formData.lastName || ""}
                  onChangeText={handleInputChange}
                />
                <EditableInfoRow
                  icon={<Ionicons name="mail" size={18} color="#64748b" />}
                  label="Email"
                  field="email"
                  value={formData.email || ""}
                  keyboardType="email-address"
                  onChangeText={handleInputChange}
                />
                <EditableInfoRow
                  icon={<Ionicons name="call" size={18} color="#64748b" />}
                  label="Mobile"
                  field="mobile"
                  value={formData.mobile || ""}
                  keyboardType="phone-pad"
                  onChangeText={handleInputChange}
                />
                <EditableInfoRow
                  icon={<Ionicons name="call" size={18} color="#64748b" />}
                  label="Alt Mobile"
                  field="alternativeMobile"
                  value={formData.alternativeMobile || ""}
                  keyboardType="phone-pad"
                  onChangeText={handleInputChange}
                />
                <EditableInfoRow
                  icon={<Ionicons name="calendar" size={18} color="#64748b" />}
                  label="Date of Birth"
                  field="dob"
                  value={formData.dob || ""}
                  onChangeText={handleInputChange}
                />
                <EditableInfoRow
                  icon={<Ionicons name="male-female" size={18} color="#64748b" />}
                  label="Gender"
                  field="gender"
                  value={formData.gender || ""}
                  onChangeText={handleInputChange}
                />
                <EditableInfoRow
                  icon={<Ionicons name="home" size={18} color="#64748b" />}
                  label="Address"
                  field="address"
                  value={formData.address || ""}
                  onChangeText={handleInputChange}
                />
              </>
            ) : (
              <>
                <InfoRow
                  icon={<Ionicons name="mail" size={18} color="#64748b" />}
                  label="Email"
                  value={employee.email}
                />
                <InfoRow
                  icon={<Ionicons name="call" size={18} color="#64748b" />}
                  label="Mobile"
                  value={employee.mobile}
                />
                <InfoRow
                  icon={<Ionicons name="call" size={18} color="#64748b" />}
                  label="Alt Mobile"
                  value={employee.alternativeMobile}
                />
                <InfoRow
                  icon={<Ionicons name="calendar" size={18} color="#64748b" />}
                  label="Date of Birth"
                  value={employee.dob}
                />
                <InfoRow
                  icon={<Ionicons name="male-female" size={18} color="#64748b" />}
                  label="Gender"
                  value={employee.gender}
                />
                <InfoRow
                  icon={<Ionicons name="home" size={18} color="#64748b" />}
                  label="Address"
                  value={employee.address}
                />
              </>
            )}
          </ProfileSection>

          {/* Employment Information */}
          <ProfileSection title="Employment Information">
            {isEditing ? (
              <>
                <EditableInfoRow
                  icon={<FontAwesome5 name="building" size={16} color="#64748b" />}
                  label="Branch"
                  field="branch"
                  value={formData.branch || ""}
                  onChangeText={handleInputChange}
                />
                <EditableInfoRow
                  icon={<MaterialIcons name="work" size={18} color="#64748b" />}
                  label="Position"
                  field="position"
                  value={formData.position || ""}
                  onChangeText={handleInputChange}
                />
                <EditableInfoRow
                  icon={<Ionicons name="calendar" size={18} color="#64748b" />}
                  label="Joining Date"
                  field="dateOfJoining"
                  value={formData.dateOfJoining || ""}
                  onChangeText={handleInputChange}
                />
                <EditableInfoRow
                  icon={<MaterialIcons name="attach-money" size={18} color="#64748b" />}
                  label="Salary"
                  field="salary"
                  value={formData.salary || ""}
                  keyboardType="numeric"
                  onChangeText={handleInputChange}
                />
                <EditableInfoRow
                  icon={<FontAwesome5 name="calendar-day" size={16} color="#64748b" />}
                  label="Week Off"
                  field="weekOff"
                  value={formData.weekOff || ""}
                  onChangeText={handleInputChange}
                />
              </>
            ) : (
              <>
                <InfoRow
                  icon={<FontAwesome5 name="building" size={16} color="#64748b" />}
                  label="Branch"
                  value={employee.branch || ""}
                />
                <InfoRow
                  icon={<MaterialIcons name="work" size={18} color="#64748b" />}
                  label="Position"
                  value={employee.position || ""}
                />
                <InfoRow
                  icon={<Ionicons name="calendar" size={18} color="#64748b" />}
                  label="Joining Date"
                  value={employee.dateOfJoining}
                />
                <InfoRow
                  icon={<MaterialIcons name="attach-money" size={18} color="#64748b" />}
                  label="Salary"
                  value={`$${(employee.salary ?? 0).toLocaleString()}`}
                />
                <InfoRow
                  icon={<FontAwesome5 name="calendar-day" size={16} color="#64748b" />}
                  label="Week Off"
                  value={employee.weekOff ?? ""}
                />
              </>  ///{client.companyName}
            )}
          </ProfileSection>


          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
      <BottomNavBar activeTab="Profile" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:0,
  },
  background: {
    flex: 1,
  },
  // header: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   paddingTop: 30,
  //   paddingBottom: 10,
  //   paddingHorizontal: 6,
  //   backgroundColor: "#7726B8",
  //   borderBottomWidth: 1,
  //   borderBottomColor: "#e2e8f0",
  // },
  desktopHeader: {
    paddingHorizontal: 32,
  },
  // headerTitle: {
  //   fontSize: 20,
  //   fontWeight: "600",
  //   color: "#ffffff",
  // },
  menuButton: {
    padding: 8,
    color: "#ffffff",

  },

    header: {
        flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  modalContainer: {
    width: "60%",
    height: "100%",
  },
  desktopModalContainer: {
    width: "30%",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 16,
    marginTop: 56,
    marginRight: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  desktopModalContent: {
    marginTop: 72,
    marginRight: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#334155",
  },
  logoutMenuItem: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginTop: 4,
  },
  logoutText: {
    color: "#ef4444",
  },
  scrollView: {
    flex: 1,
    marginBottom:50,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  desktopScrollContent: {
    paddingHorizontal: 32,
  },
  profileImageSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#e2e8f0",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#3b82f6",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  nameContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  employeeName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1e293b",
  },
  employeePosition: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 4,
  },
  employeeBranch: {
    fontSize: 18,
    fontWeight: "800",
    color: "#010101ff",
    marginTop: 2,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  desktopSection: {
    marginHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  sectionContent: {
    paddingHorizontal: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  editableInfoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabelText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
    maxWidth: "50%",
  },
  editInput: {
    fontSize: 14,
    color: "#334155",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f8fafc",
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: "#7726B8",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
  },
});

export default Employee;

