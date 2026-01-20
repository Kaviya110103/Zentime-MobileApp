// import type { RootStackParamList } from "../types";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { BlurView } from 'expo-blur';
import { CameraMode, CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { LinearGradient } from 'expo-linear-gradient';
// import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImageManipulator from 'expo-image-manipulator';
import { router, useLocalSearchParams } from 'expo-router';
import { useContext } from "react";
import { EmployeeContext } from "../context/EmployeeContext";






const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');




export default function MarkTimeOutScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("front");
  const [showSuccess, setShowSuccess] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
const { employee, setEmployee, logout } = useContext(EmployeeContext);
const companyCode = employee?.companyCode; 

 const { recordId } = useLocalSearchParams();
  const recId = Number(recordId);








  if (!permission) return null;
 
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient
          colors={['#ffffff', '#f8f8f8']}
          style={styles.permissionGradient}
        >
          <View style={styles.permissionContent}>
            <View style={styles.permissionIconContainer}>
              <AntDesign name="camera" size={48} color="#351153" />
            </View>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              To mark your attendance, we need access to your camera for facial verification
            </Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#351153', '#4a1a7a']}
                style={styles.permissionButtonGradient}
              >
                <Text style={styles.permissionButtonText}>Allow Camera Access</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }




  const takePicture = async () => {
    try {
      const photo = await ref.current?.takePictureAsync({
        quality: 1,
        skipProcessing: true,
      });




      if (!photo?.uri) return;




      const compressed = await ImageManipulator.manipulateAsync(
        photo.uri,
        [],
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );




      setUri(compressed.uri);
    } catch (error) {
      Alert.alert("Error", "Failed to capture or compress image.");
      console.error("Capture error:", error);
    }
  };




  const toggleMode = () => {
    setMode((prev) => (prev === "picture" ? "video" : "picture"));
  };




  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };




  const toggleFlash = () => {
    setFlashOn(prev => !prev);
  };




  const uploadPhoto = async () => {
    if (!uri || !recordId) {
      Alert.alert("Error", "Please capture an image first");
      return;
    }




    try {
      const uriParts = uri.split(".");
      const fileType = uriParts[uriParts.length - 1];




      const formData = new FormData();
      formData.append("recordId", recordId.toString());
      formData.append("imageOut", {
        uri,
        name: `timeout_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      } as any);




      // const apiUrl = 'http://.iieawstesting.in/api/attendance/mark-time-out;




      const res = await fetch(`https://${companyCode}.zentime.co.in/api/attendance/mark-time-out`, {
        method: "POST",
        body: formData,
      });




      if (res.ok) {
        setShowSuccess(true);
        Alert.alert("Success", "Time-out marked successfully!");
        setUri(null);
        router.replace("/MarkAttendance");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Upload failed: " + error.message);
    }
  };




  const renderPicture = () => (
    <View style={styles.previewContainer}>
      <LinearGradient
        colors={['#ffffff', '#f8f8f8']}
        style={styles.previewGradient}
      >
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Verify Your Attendance</Text>
          <Text style={styles.previewSubtitle}>Please confirm your time-out photo</Text>
        </View>




        <View style={styles.imageContainer}>
          <Image
            source={{ uri: uri! }}
            contentFit="cover"
            style={styles.capturedImage}
            transition={200}
          />
          <View style={styles.imageOverlay} />
        </View>




        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.actionButton, styles.retakeButton]}
            onPress={() => setUri(null)}
            activeOpacity={0.7}
          >
            <Feather name="refresh-ccw" size={20} color="#351153" />
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>




          <View style={styles.buttonSpacer} />




          <TouchableOpacity
            style={styles.actionButton}
            onPress={uploadPhoto}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#351153', '#4a1a7a']}
              style={styles.submitButtonGradient}
            >
              <AntDesign name="checkcircle" size={20} color="white" />
              <Text style={styles.submitButtonText}>Upload</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );




  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        ref={ref}
        mode={mode}
        facing={facing}
        enableTorch={flashOn}
        mute={false}
        responsiveOrientationWhenOrientationLocked
      />




      {/* Overlay with face guide */}
      <View style={styles.faceGuideOverlay}>
        <View style={styles.faceGuideContainer}>
          <View style={styles.faceGuide} />
          <Text style={styles.faceGuideText}>Align your face within the frame</Text>
        </View>
      </View>




      {/* Top controls */}
      <View style={styles.topControlsContainer}>
        <BlurView intensity={30} style={styles.topControlsBlur}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleFlash}
            activeOpacity={0.7}
          >
            <Feather
              name={flashOn ? "zap" : "zap-off"}
              size={24}
              color={flashOn ? "#351153" : "#351153"}
            />
          </TouchableOpacity>




          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleMode}
            activeOpacity={0.7}
          >
            <Feather
              name={mode === "picture" ? "camera" : "video"}
              size={24}
              color="#351153"
            />
          </TouchableOpacity>




          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleFacing}
            activeOpacity={0.7}
          >
            <FontAwesome6
              name="camera-rotate"
              size={24}
              color="#351153"
            />
          </TouchableOpacity>
        </BlurView>
      </View>




      {/* Bottom controls */}
      <View style={styles.bottomControlsContainer}>
        <BlurView intensity={30} style={styles.bottomControlsBlur}>
          <View style={styles.shutterContainer}>
            <TouchableOpacity
              style={styles.shutterButton}
              onPress={takePicture}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#351153', '#4a1a7a']}
                style={styles.shutterOuter}
              >
                <View style={styles.shutterInner} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    </View>
  );




  return uri ? renderPicture() : renderCamera();
}




const styles = StyleSheet.create({
  // Permission Screen Styles
  permissionContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  permissionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  permissionContent: {
    width: '100%',
    alignItems: 'center',
  },
  permissionIconContainer: {
    backgroundColor: 'rgba(53, 17, 83, 0.1)',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(53, 17, 83, 0.3)',
  },
  permissionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#351153',
    marginBottom: 15,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  permissionButton: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#351153',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  permissionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },




  // Camera Screen Styles
  cameraContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  faceGuideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 20,
  },
  faceGuideContainer: {
    width: SCREEN_WIDTH - 80,
    aspectRatio: 0.7,
    borderWidth: 2,
    borderColor: 'rgba(53, 17, 83, 0.3)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: '90%',
    height: '90%',
    borderWidth: 1,
    borderColor: 'rgba(53, 17, 83, 0.2)',
    borderRadius: 15,
  },
  faceGuideText: {
    position: 'absolute',
    bottom: -40,
    color: '#351153',
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  topControlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  topControlsBlur: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(53, 17, 83, 0.1)',
  },
  bottomControlsContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  bottomControlsBlur: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 30,
    paddingVertical: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(53, 17, 83, 0.1)',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterContainer: {
    alignItems: 'center',
  },
  shutterButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#351153',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(53, 17, 83, 0.2)',
    borderWidth: 2,
    borderColor: '#351153',
  },




  // Preview Screen Styles
  previewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  previewGradient: {
    flex: 1,
    padding: 20,
  },
  previewHeader: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 30,
  },
  previewTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#351153',
    letterSpacing: 0.5,
  },
  previewSubtitle: {
    fontSize: 16,
    color: '#555',
    marginTop: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  capturedImage: {
    width: '90%',
    aspectRatio: 3/4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(53, 17, 83, 0.1)',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  buttonSpacer: {
    width: 20, // Added spacer between buttons
  },
  actionButton: {
    borderRadius: 30,
    overflow: 'hidden',
    flex: 1, // Make buttons take equal space
  },
  retakeButton: {
    backgroundColor: 'rgba(53, 17, 83, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(53, 17, 83, 0.5)',
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    justifyContent: 'center',
  },
  retakeButtonText: {
    color: '#351153',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});











