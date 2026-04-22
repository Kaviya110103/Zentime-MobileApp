import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmployeeContext } from '../context/EmployeeContext';

type BottomNavBarProps = {
  activeTab: string;
};

type BottomNavItemProps = {
  icon: React.ReactElement<{ size?: number; color?: string }>;
  label: string;
  active: boolean;
  onPress: () => void;
};

const BottomNavItem: React.FC<BottomNavItemProps> = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    {React.cloneElement(icon, {
      size: 24,
      color: active ? 'white' : '#D9B3FF',
    })}
    <Text style={[styles.navLabel, active && { color: 'white' }]}>{label}</Text>
  </TouchableOpacity>
);

const BottomNavigation: React.FC<BottomNavBarProps> = ({ activeTab }) => {
  const router = useRouter();
  const { employee, logout } = useContext(EmployeeContext);
  const insets = useSafeAreaInsets();

  const employeeId = employee?.id;
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.bottomNav, { height: 62 + bottomInset, paddingBottom: bottomInset }]}> 
      <BottomNavItem
        icon={<FontAwesome5 name="home" />}
        label="Home"
        active={activeTab === 'Home'}
        onPress={() => router.push('/MarkAttendance')}
      />
      <BottomNavItem
        icon={<FontAwesome5 name="bus" />}
        label="Leave"
        active={activeTab === 'Leave'}
        onPress={() => {
          if (employeeId) {
            router.push({
              pathname: '/LeavePermission',
              params: { employeeId },
            });
          }
        }}
      />
      <BottomNavItem
        icon={<FontAwesome5 name="user" />}
        label="Profile"
        active={activeTab === 'Profile'}
        onPress={() => router.push('/EmployeeProfile')}
      />
      <BottomNavItem
        icon={<FontAwesome5 name="clipboard" />}
        label="Permission"
        active={activeTab === 'Permission'}
        onPress={() => {
          if (employeeId) {
            router.push({
              pathname: '/EmployeePermission',
              params: { employeeId },
            });
          }
        }}
      />
      <BottomNavItem
        icon={<FontAwesome5 name="sign-out-alt" />}
        label="Log out"
        active={false}
        onPress={async () => {
          await logout();
          router.replace('/EmployeeLogin');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#351153',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 20,
    elevation: 20,
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navLabel: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 4,
    fontWeight: '600',
  },
});

export default BottomNavigation;
