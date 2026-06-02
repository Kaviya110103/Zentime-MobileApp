import BottomNavBar from '../components/BottomNavBar';
import { EmployeeContext } from "../context/EmployeeContext";
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppTypography';
import { buildApiUrl, withClientId } from '../lib/api';

interface AttendanceReport {
  firstName: string;
  empId: string;
  name: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  workingHours?: string;
  missedTimes?: string;
  attendanceStatus: string;
  imageIn?: string;
  imageOut?: string;
}

const EmployeeAttendanceReport = () => {
  const { employee } = useContext(EmployeeContext);
  const [isLoading, setIsLoading] = useState(true);
  const [companyCode, setCompanyCode] = useState('');
  const [employeeId, setEmployeeId] = useState(0);
  const [clientId, setClientId] = useState('');
  
  const [reportData, setReportData] = useState<AttendanceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [printData, setPrintData] = useState<AttendanceReport[]>([]);
  const [client, setClient] = useState<any>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [employeeDetails, setEmployeeDetails] = useState({
    firstName: '',
    branch: '',
    mobile: '',
    position: '',
  });

  // Initialize employee data
  useEffect(() => {
    if (employee) {
      setCompanyCode(employee?.companyCode || '');
      const normalizedEmployeeId = Number(employee?.id);
      setEmployeeId(Number.isFinite(normalizedEmployeeId) ? normalizedEmployeeId : 0);
      setClientId(String(employee?.clientId || ''));
      setIsLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId || !companyCode) return;
      
      try {
        const res = await axios.get(buildApiUrl(`/api/clients/${clientId}`));
        setClient(res.data);
      } catch (err) {
        console.error('Error fetching client:', err);
        // Only show alert if this is not the initial silent load
        if (initialLoadComplete) {
          Alert.alert('Error', 'Unable to fetch client details');
        }
      }
    };

    fetchClient();
  }, [clientId, companyCode]);

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!employeeId || !companyCode) return;
      
      try {
        const res = await axios.get(buildApiUrl(`/api/employees/${employeeId}`, { clientId }));
        setEmployeeDetails({
          firstName: res.data.firstName || '',
          branch: res.data.branch || '',
          mobile: res.data.mobile || '',
          position: res.data.position || '',
        });
      } catch (err) {
        console.error('Error fetching employee details:', err);
      }
    };
    
    if (employeeId && companyCode) {
      fetchEmployeeDetails();
    }
  }, [employeeId, companyCode]);

  useEffect(() => {
    if (employeeId && companyCode) {
      fetchReportData();
    }
  }, [currentDate, employeeId, companyCode]);

  const fetchReportData = async () => {
    if (!employeeId || !companyCode) return;
    
    setLoading(true);
    try {
      let month = currentDate.getMonth() + 1;
      let year = currentDate.getFullYear();
      
      const response = await axios.get(
        buildApiUrl(`/api/attendance/employee/${employeeId}`),
        { 
          params: withClientId({ month, year }, clientId),
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('API Response:', response.data); // Debug log

      const normalizeDateLabel = (raw?: string | null) => {
        const value = String(raw || '').trim();
        if (!value) return 'N/A';
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [yyyy, mm, dd] = value.split('-');
          return `${dd}/${mm}/${yyyy}`;
        }
        return value;
      };

      let sourceData = Array.isArray(response.data) ? response.data : [];
      if (sourceData.length === 0) {
        const monthSliceRes = await axios.get(
          buildApiUrl(`/api/attendance/monthly/${employeeId}/${year}/${String(month).padStart(2, '0')}`),
          {
            params: withClientId({}, clientId),
            timeout: 10000,
          }
        );
        sourceData = Array.isArray(monthSliceRes.data) ? monthSliceRes.data : [];
      }

      const formattedData = sourceData.map((item: any) => {
        // Debug the missedTimes field
        console.log('Item missedTimes:', item.missedTimes, 'Type:', typeof item.missedTimes);
        
        return {
          empId: employeeId.toString(),
          firstName: item.firstName || employeeDetails.firstName || 'N/A',
          name: item.name || item.firstName || employeeDetails.firstName || 'N/A',
          date: normalizeDateLabel(item.date),
          timeIn: item.timeIn,
          timeOut: item.timeOut,
          workingHours: calculateWorkingHours(item.timeIn, item.timeOut),
          // Handle missedTimes - check various possible formats
          missedTimes: item.missedTimes !== null && item.missedTimes !== undefined 
            ? formatMinutesToHours(item.missedTimes)
            : '0h 0m',
          attendanceStatus: item.attendanceStatus || 'Absent',
          imageIn: item.imageIn,
          imageOut: item.imageOut
        };
      });

      setReportData(formattedData);
      setPrintData(formattedData);
      setInitialLoadComplete(true);
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      
      // Check if it's a network error
      if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else if (error.response) {
        // Server responded with error
        Alert.alert('Error', error.response.data?.message || 'Failed to fetch attendance data');
      } else {
        Alert.alert('Error', 'Failed to fetch attendance data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatMinutesToHours = (minutes: any) => {
    console.log('formatMinutesToHours input:', minutes, 'Type:', typeof minutes);
    
    // Handle null/undefined
    if (minutes === null || minutes === undefined || minutes === '') {
      return '0h 0m';
    }
    
    // Handle string that might already be formatted
    if (typeof minutes === 'string') {
      // Check if it's already in "Xh Ym" format
      if (minutes.includes('h') || minutes.includes('m')) {
        return minutes;
      }
      
      // Try to parse as number
      const minsNum = Number.parseInt(minutes, 10);
      if (!Number.isNaN(minsNum)) {
        const hours = Math.floor(minsNum / 60);
        const mins = minsNum % 60;
        return `${hours}h ${mins}m`;
      }
    }
    
    // Handle number
    if (typeof minutes === 'number') {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    
    // Default fallback
    return '0h 0m';
  };

  const calculateWorkingHours = (timeIn?: string, timeOut?: string) => {
    if (!timeIn || !timeOut) return '0h 0m';
    
    try {
      const inTime = new Date(timeIn);
      const outTime = new Date(timeOut);
      
      // Check if dates are valid
      if (Number.isNaN(inTime.getTime()) || Number.isNaN(outTime.getTime())) {
        return '0h 0m';
      }
      
      const diffMs = outTime.getTime() - inTime.getTime();
      
      if (diffMs < 0) return 'Invalid';
      
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      
      return `${hours}h ${minutes}m`;
    } catch {
      return '0h 0m';
    }
  };

  const formatTime = (dateTimeString?: string) => {
    if (!dateTimeString) return '--:--';
    try {
      const date = new Date(dateTimeString);
      if (Number.isNaN(date.getTime())) return '--:--';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '--:--';
    }
  };

  const getPeriodString = () => {
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const shiftMonth = (delta: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(1);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const generatePDFHtml = () => {
    if (!client) {
      return '<html><body><h1>Loading client data...</h1></body></html>';
    }

    const tableRows = reportData.map(item => {
      let statusColor = 'color: #FF9800;';
      if (item.attendanceStatus === 'Present') {
        statusColor = 'color: #4CAF50;';
      } else if (item.attendanceStatus === 'Absent') {
        statusColor = 'color: #F44336;';
      }
      return `
      <tr>
        <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">${item.date}</td>
        <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">${formatTime(item.timeIn)}</td>
        <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">${formatTime(item.timeOut)}</td>
        <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">${item.workingHours}</td>
        <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center;">${item.missedTimes}</td>
        <td style="padding: 10px; border: 1px solid #e0e0e0; text-align: center; ${statusColor} font-weight: 500;">
          ${item.attendanceStatus}
        </td>
      </tr>
    `;
    }).join('');

    const totalPresent = reportData.filter(item => item.attendanceStatus === 'Present').length;
    const totalAbsent = reportData.filter(item => item.attendanceStatus === 'Absent').length;
    const totalRecords = reportData.length;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Attendance Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #7726B9;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #7726B9;
              margin-bottom: 10px;
            }
            .report-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
            }
            .report-period {
              font-size: 16px;
              color: #666;
              margin-bottom: 5px;
            }
            .employee-info {
              font-size: 14px;
              color: #666;
              margin: 2px 0;
            }
            .table-container {
              margin: 20px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              background-color: white;
            }
            th {
              background-color: #f5f5f5;
              padding: 10px;
              border: 1px solid #e0e0e0;
              text-align: center;
              font-weight: bold;
              color: #333;
            }
            td {
              padding: 10px;
              border: 1px solid #e0e0e0;
              text-align: center;
              color: #333;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            .summary {
              display: flex;
              justify-content: space-around;
              margin: 20px 0;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 8px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-number {
              font-size: 24px;
              font-weight: bold;
              color: #7726B9;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            .no-data {
              text-align: center;
              padding: 40px;
              color: #666;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${client.companyName || 'Company'}</div>
            <div class="report-title">Monthly Attendance Report</div>
            <div class="report-period">${getPeriodString()}</div>
            <div class="employee-info">Employee ID: ${employeeId}</div>
            <div class="employee-info">Name: ${employeeDetails.firstName}</div>
            <div class="employee-info">Branch: ${employeeDetails.branch}</div>
            <div class="employee-info">Mobile: ${employeeDetails.mobile}</div>
            <div class="employee-info">Position: ${employeeDetails.position}</div>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-number">${totalRecords}</div>
              <div class="summary-label">Total Days</div>
            </div>
            <div class="summary-item">
              <div class="summary-number" style="color: #4CAF50;">${totalPresent}</div>
              <div class="summary-label">Present</div>
            </div>
            <div class="summary-item">
              <div class="summary-number" style="color: #F44336;">${totalAbsent}</div>
              <div class="summary-label">Absent</div>
            </div>
            <div class="summary-item">
              <div class="summary-number" style="color: #7726B9;">${
                totalRecords > 0 ? ((totalPresent / totalRecords) * 100).toFixed(1) : 0
              }%</div>
              <div class="summary-label">Attendance Rate</div>
            </div>
          </div>

          <div class="table-container">
            ${reportData.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Working Hours</th>
                    <th>Missed Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            ` : `
              <div class="no-data">
                No attendance records found for ${getPeriodString()}
              </div>
            `}
          </div>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>This is a system-generated report. No signature required.</p>
          </div>
        </body>
      </html>
    `;
  };

  const generateAndSharePDF = async () => {
    try {
      setPdfLoading(true);
      const htmlContent = generatePDFHtml();
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      const fileName = `Attendance_Report_${employeeId}_${getPeriodString().replace(' ', '_')}.pdf`;
      
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        Alert.alert('Success', 'PDF downloaded successfully!');
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Share Attendance Report',
          mimeType: 'application/pdf'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    } finally {
      setPdfLoading(false);
    }
  };

  // Show loading screen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7726B9" />
        <Text style={styles.loadingText}>Loading employee data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <LinearGradient
          colors={['#7726B9', '#5E1D9E']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.headerTitle}>Monthly Attendance Report</Text>
        </LinearGradient>
        
        <View style={styles.printContainer}>
          <View style={styles.printHeader}>
            <View style={styles.periodRow}>
              <TouchableOpacity style={styles.periodButton} onPress={() => shiftMonth(-1)}>
                <Feather name="chevron-left" size={18} color="#7726B9" />
              </TouchableOpacity>
              <Text style={styles.printSubtitle}>{getPeriodString()}</Text>
              <TouchableOpacity style={styles.periodButton} onPress={() => shiftMonth(1)}>
                <Feather name="chevron-right" size={18} color="#7726B9" />
              </TouchableOpacity>
            </View>
            <Text style={styles.employeeName}>{employeeDetails.firstName}</Text>
          </View>
          
          <ScrollView style={styles.printScroll}>
            {reportData.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No attendance records found for {getPeriodString()}</Text>
              </View>
            ) : (
              <View style={styles.printTable}>
                <View style={styles.printTableHeader}>
                  <Text style={styles.printHeaderCell}>Date</Text>
                  <Text style={styles.printHeaderCell}>Time In</Text>
                  <Text style={styles.printHeaderCell}>Time Out</Text>
                  <Text style={styles.printHeaderCell}>Working Hours</Text>
                  <Text style={styles.printHeaderCell}>Missed Time</Text>
                  <Text style={styles.printHeaderCell}>Status</Text>
                </View>
                
                {printData.map((item) => {
                  let statusStyle = styles.printOtherStatus;
                  if (item.attendanceStatus === 'Present') {
                    statusStyle = styles.printPresentStatus;
                  } else if (item.attendanceStatus === 'Absent') {
                    statusStyle = styles.printAbsentStatus;
                  }
                  return (
                  <View key={item.date} style={styles.printTableRow}>
                    <Text style={styles.printCell}>{item.date}</Text>
                    <Text style={styles.printCell}>{formatTime(item.timeIn)}</Text>
                    <Text style={styles.printCell}>{formatTime(item.timeOut)}</Text>
                    <Text style={styles.printCell}>{item.workingHours}</Text>
                    <Text style={styles.printCell}>{item.missedTimes}</Text>
                    <Text style={[styles.printCell, statusStyle]}>
                      {item.attendanceStatus}
                    </Text>
                  </View>
                );
                })}
              </View>
            )}
          </ScrollView>
          
          <View style={styles.printFooter}>
            <Text style={styles.printFooterText}>Generated on {new Date().toLocaleDateString()}</Text>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={generateAndSharePDF}
              disabled={pdfLoading || reportData.length === 0}
            >
              {pdfLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Feather name="download" size={20} color="white" />
                  <Text style={styles.downloadButtonText}>Download PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7726B9" />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
        </View>
      )}
      
      <BottomNavBar activeTab="" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: 0,
  },
  contentWrapper: {
    flex: 1,
    paddingBottom: 78,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7726B9',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  printContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  printHeader: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  periodButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8B4FE',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0FF',
  },
  printSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#4a6da7',
    marginTop: 8,
    fontWeight: 'bold',
  },
  employeeName: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  printScroll: {
    flex: 1,
  },
  printTable: {
    marginBottom: 20,
  },
  printTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  printHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
    fontSize: 12,
  },
  printTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 10,
  },
  printCell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
    fontSize: 12,
  },
  printPresentStatus: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  printAbsentStatus: {
    color: '#F44336',
    fontWeight: '500',
  },
  printOtherStatus: {
    color: '#FF9800',
    fontWeight: '500',
  },
  printFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  printFooterText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 12,
  },
  modalButtons: {
    marginTop: 16,
  },
  downloadButton: {
    backgroundColor: '#7726B9',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default EmployeeAttendanceReport;

