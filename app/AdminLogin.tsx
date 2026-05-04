import React, { useContext, useState } from "react";
import { Alert, ImageBackground, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppTypography';
import { useRouter } from "expo-router";
import { buildApiUrl } from "../lib/api";
import { EmployeeContext } from "../context/EmployeeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppTheme } from "../context/AppThemeContext";

const WALKTHROUGH_DONE_KEY = 'walkthroughCompleted';

export default function AdminLogin() {
  const router = useRouter();
  const { setAdminClient } = useContext(EmployeeContext);
  const { isDark, colors } = useAppTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const placeholderColor = isDark ? "#94a3b8" : "#999";

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter username and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(buildApiUrl("/api/clients/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      if (!response.ok) {
        Alert.alert("Login failed", "Invalid admin credentials.");
        return;
      }

      const data = await response.json();
      await AsyncStorage.setItem(WALKTHROUGH_DONE_KEY, 'true');
      await setAdminClient(data);
      router.replace("/AdminDashboard");
    } catch (error) {
      console.error("Admin login error:", error);
      Alert.alert("Network error", "Unable to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/bg1.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Admin Login</Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <>
            <Text style={[styles.label, { color: colors.mutedText }]}>Username*</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? "#0f172a" : "#fff",
                  color: colors.text,
                },
              ]}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="Enter admin username"
              placeholderTextColor={placeholderColor}
            />

            <Text style={[styles.label, { color: colors.mutedText }]}>Password*</Text>
            <View
              style={[
                styles.passwordContainer,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? "#0f172a" : "#fff",
                },
              ]}
            >
              <TextInput
                style={[styles.passwordInput, { color: colors.text }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter password"
                placeholderTextColor={placeholderColor}
              />
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <Text style={[styles.showText, { color: colors.primary }]}>{showPassword ? "Hide" : "Show"}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
                isSubmitting && styles.disabledButton,
              ]}
              disabled={isSubmitting}
              onPress={handleLogin}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>
          </>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.primary }]}
            onPress={() => router.replace("/EmployeeLogin")}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Back to Employee Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  heading: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  passwordContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
  },
  showText: {
    color: "#351153",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#351153",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#351153",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  secondaryButtonText: {
    color: "#351153",
    fontWeight: "600",
  },
});

