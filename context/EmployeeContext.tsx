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
  setEmployee: (emp: Employee | null) => void;
  logout: () => Promise<void>;
}

export const EmployeeContext = createContext<EmployeeContextType>({
  employee: null,
  setEmployee: () => {},
  logout: async () => {},
});

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employee, setEmployeeState] = useState<Employee | null>(null);

  useEffect(() => {
    const loadEmployee = async () => {
      const stored = await AsyncStorage.getItem('employee');
      if (stored) setEmployeeState(JSON.parse(stored));
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
  await AsyncStorage.removeItem('employee');
  await AsyncStorage.removeItem('employeeCredentials'); // <-- Add this line
  setEmployeeState(null);
};

  return (
    <EmployeeContext.Provider value={{ employee, setEmployee, logout }}>
      {children}
    </EmployeeContext.Provider>
  );
};
