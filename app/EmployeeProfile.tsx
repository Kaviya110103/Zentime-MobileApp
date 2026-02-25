import BottomNavBar from "../components/BottomNavBar";
// @ts-ignore - expo/vector-icons type declarations issue
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmployeeContext } from "../context/EmployeeContext";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const { employee, setEmployee, logout } = useContext(EmployeeContext);
  const companyCode = employee?.companyCode;
  const employeeId = employee?.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Prevent multiple fetches
  const hasFetched = useRef(false);

  // Fetch employee data on initial load - FIXED: Only fetch if data is missing
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeId || hasFetched.current) return;
      
      // If employee data already exists in context, use it immediately
      if (employee?.id === employeeId) {
        setFormData(employee as unknown as Partial<Employee>);
        setLoading(false);
        hasFetched.current = true;
        return;
      }

      try {
        hasFetched.current = true;
        setLoading(true);
        const response = await fetch(`http://192.168.1.15:8080/api/employees/${employeeId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Batch state updates to prevent multiple re-renders
        setEmployee(data);
        setFormData(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        Alert.alert("Error", "Failed to fetch employee data");
      }
    };

    fetchEmployeeData();
  }, [employeeId]); // REMOVED: companyCode, setEmployee from dependencies to prevent re-fetching

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleInputChange = useCallback((field: keyof Employee, value: string) => {
    setFormData(prev => {
      let fieldValue: any = value;
      if (field === "salary") {
        fieldValue = value === "" ? null : Number(value);
      }
      return {
        ...prev,
        [field]: fieldValue
      };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!employeeId || !companyCode) return;

    try {
      setSaving(true);
      const response = await fetch(`http://192.168.1.15:8080/api/employees/update/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const updatedEmployee = await response.json();
      setEmployee(updatedEmployee);
      setFormData(updatedEmployee); // Update formData too
      setIsEditing(false);
      setSaving(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (err) {
      setSaving(false);
      Alert.alert("Error", "Failed to update profile");
      console.error("Update error:", err);
    }
  }, [employeeId, formData, setEmployee, companyCode]);

  const toggleEditMode = useCallback(() => {
    if (!isEditing && employee) {
      // When entering edit mode, ensure formData is current
      setFormData(employee as unknown as Partial<Employee>);
    }
    setIsEditing(!isEditing);
    setMenuVisible(false);
  }, [isEditing, employee]);

  const handleCancel = useCallback(() => {
    // Reset form data to original employee data
    if (employee) {
      setFormData(employee as unknown as Partial<Employee>);
    }
    setIsEditing(false);
  }, [employee]);

  const pickImageAndUpload = useCallback(async () => {
    if (!companyCode || !employeeId) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedAsset = result.assets[0];

      try {
        const response = await fetch(
          `http://192.168.1.15:8080/api/employees/${employeeId}/profile-image`,
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
            `http://192.168.1.15:8080/api/employees/${employeeId}`
          );
          if (updatedResponse.ok) {
            const updatedData = await updatedResponse.json();
            setEmployee(updatedData);
            setFormData(updatedData);
          }
        } else {
          alert("Failed to upload image.");
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred during upload.");
      }
    }
  }, [employeeId, companyCode, setEmployee]);

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#ffffff", "#f8fafc"]} style={styles.background}>
        {/* Header */}
        <LinearGradient
          colors={['#7726B9', '#5E1D9E']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.headerTitle}>Employee Profile</Text>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu" size={24} color="#ffffff" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Menu Modal */}
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

                <TouchableOpacity style={styles.menuItem} onPress={() => {
                  setMenuVisible(false);
                  router.push("/MarkAttendance");
                }}>
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
                source={{ 
                  uri: employee.profileImage || 'https://via.placeholder.com/100'
                }}
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
                  icon={<MaterialIcons name="currency-rupee" size={18} color="#64748b" />}
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
                  icon={<MaterialIcons name="currency-rupee" size={18} color="#64748b" />}
                  label="Salary"
                  value={`₹${(employee.salary ?? 0).toLocaleString('en-IN')}`}
                />
                <InfoRow
                  icon={<FontAwesome5 name="calendar-day" size={16} color="#64748b" />}
                  label="Week Off"
                  value={employee.weekOff ?? ""}
                />
              </>
            )}
          </ProfileSection>

          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        
        {/* Bottom Nav Bar */}
        <BottomNavBar activeTab="Profile" />
      </LinearGradient>
    </View>
  );
};

// Component definitions moved outside of Employee component
const ProfileSection = React.memo<{ title: string; children: React.ReactNode }>(({ title, children }) => (
  <View style={[styles.section, Dimensions.get('window').width >= 768 && styles.desktopSection]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
));

const InfoRow = React.memo<{ icon: React.ReactNode; label: string; value: string | number }>(({
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
));

const EditableInfoRow = React.memo<{
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0,
    backgroundColor: '#ffffff',
  },
  background: {
    flex: 1,
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
  menuButton: {
    padding: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  saveButton: {
    backgroundColor: "#3b82f6",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#e5e7eb",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  profileImageSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
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
  },
  nameContainer: {
    alignItems: "center",
  },
  employeeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  employeePosition: {
    fontSize: 14,
    color: "#6b7280",
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  desktopSection: {
    marginHorizontal: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  sectionContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  infoLabelText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    textAlign: "right",
  },
  editableInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  editInput: {
    flex: 1,
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 80,
  },
  desktopScrollContent: {
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  modalContainer: {
    marginTop: 60,
    marginRight: 16,
  },
  desktopModalContainer: {
    marginRight: 32,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  desktopModalContent: {
    minWidth: 250,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
  logoutMenuItem: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  logoutText: {
    color: "#ef4444",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
  },
});

export default Employee;

