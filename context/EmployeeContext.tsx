import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Employee {
  username: string | undefined;
  weekOff: string;
  salary: number;
  dateOfJoining: string | number;
  address: string | number;
  gender: string | number;
  dob: string | number;
  alternativeMobile: string | number;
  mobile: string | number;
  profileImage: string;
  branch: string;
  position: string;
  lastName: ReactNode;
  firstName: ReactNode;
  email: string | number;
  id: string;
  name?: string;
  clientId?: number;
  clientEmployeeId?: number;
  companyCode?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
}

interface EmployeeContextType {
  employee: Employee | null;
  authReady: boolean;
  setEmployee: (emp: Employee | null) => void;
  logout: () => Promise<void>;
}

export const EmployeeContext = createContext<EmployeeContextType>({
  employee: null,
  authReady: false,
  setEmployee: () => {},
  logout: async () => {},
});

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employee, setEmployeeState] = useState<Employee | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const stored = await AsyncStorage.getItem('employee');
        if (stored) setEmployeeState(JSON.parse(stored));
      } finally {
        setAuthReady(true);
      }
    };
    loadEmployee();
  }, []);

  const setEmployee = async (emp: Employee | null) => {
    if (emp) {
      await AsyncStorage.setItem('employee', JSON.stringify(emp));
    } else {
      await AsyncStorage.removeItem('employee');
    }
    setEmployeeState(emp);
  };

 const logout = async () => {
  setEmployeeState(null);
  try {
    await AsyncStorage.multiRemove(['employee', 'employeeCredentials']);
  } catch (error) {
    console.warn('Failed to clear auth storage on logout:', error);
  }
};

  return (
    <EmployeeContext.Provider value={{ employee, authReady, setEmployee, logout }}>
      {children}
    </EmployeeContext.Provider>
  );
};
