import BottomNavBar from '../components/BottomNavBar';
import { EmployeeContext } from "../context/EmployeeContext";
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
  const companyCode = employee?.companyCode;
  const employeeId = typeof employee?.id === 'number' ? employee.id : 0;
     const clientId = employee?.clientId;
  
  const [reportData, setReportData] = useState<AttendanceReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [printModalVisible, setPrintModalVisible] = useState(true);
  const [printData, setPrintData] = useState<AttendanceReport[]>([]);
    const [client, setClient] = useState<any>(null);

  const [employeeDetails, setEmployeeDetails] = useState({
    firstName: '',
    branch: '',
    mobile: '',
    position: '',
  });
useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await axios.get(`https://${companyCode}.zentime.co.in/api/clients/${clientId}`);
        setClient(res.data);
      } catch (err) {
        console.error(err);
        Alert.alert('Unable to fetch client details');
      }
    };

    if (clientId) fetchClient();
  }, [clientId]);

  // if (!client) return <Text>Loading...</Text>;
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const res = await axios.get(`https://${companyCode}.zentime.co.in/api/employees/${employeeId}`);
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
    fetchEmployeeDetails();
  }, [employeeId]);

  useEffect(() => {
    fetchReportData();
  }, [currentDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let month = currentDate.getMonth() + 1;
      let year = currentDate.getFullYear();
      
      const response = await axios.get(
        `https://${companyCode}.zentime.co.in/api/attendance/employee/${employeeId}`,
        { params: { month, year } }
      );

      const formattedData = response.data.map((item: any) => ({
        empId: employeeId,
        firstName: item.firstName ?? 'N/A',
        date: item.date,
        timeIn: item.timeIn,
        timeOut: item.timeOut,
        workingHours: calculateWorkingHours(item.timeIn, item.timeOut),
        missedTimes: formatMinutesToHours(item.missedTimes),
        attendanceStatus: item.attendanceStatus,
        imageIn: item.imageIn,
        imageOut: item.imageOut
      }));

      setReportData(formattedData);
      setPrintData(formattedData);
    } catch (error) {
      console.error('Error fetching report data:', error);
      Alert.alert('Error', 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const formatMinutesToHours = (minutes: any) => {
    if (typeof minutes === 'number') {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    if (typeof minutes === 'string') {
      const minsNum = parseInt(minutes, 10);
      if (!isNaN(minsNum)) {
        const hours = Math.floor(minsNum / 60);
        const mins = minsNum % 60;
        return `${hours}h ${mins}m`;
      }
    }
    return 'N/A';
  };

  const calculateWorkingHours = (timeIn?: string, timeOut?: string) => {
    if (!timeIn || !timeOut) return 'N/A';
    
    try {
      const inTime = new Date(timeIn);
      const outTime = new Date(timeOut);
      const diffMs = outTime.getTime() - inTime.getTime();
      
      if (diffMs < 0) return 'Invalid';
      
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      
      return `${hours}h ${minutes}m`;
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateTimeString?: string) => {
    if (!dateTimeString) return 'N/A';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const getPeriodString = () => {
    return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const generatePDFHtml = () => {
    const tableRows = reportData.map(item => `
      <tr>
        <td style="${styles.pdfTableCell}">${item.date}</td>
        <td style="${styles.pdfTableCell}">${formatTime(item.timeIn)}</td>
        <td style="${styles.pdfTableCell}">${formatTime(item.timeOut)}</td>
        <td style="${styles.pdfTableCell}">${item.workingHours}</td>
        <td style="${styles.pdfTableCell}">${item.missedTimes}</td>
        <td style="${styles.pdfTableCell} ${
          item.attendanceStatus === 'Present' ? 'color: #4CAF50;' : 
          item.attendanceStatus === 'Absent' ? 'color: #F44336;' : 'color: #FF9800;'
        } font-weight: 500;">
          ${item.attendanceStatus}
        </td>
      </tr>
    `).join('');

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
            <div class="company-name"> ${client.companyName}</div>
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
        document.body.removeChild(link);
        Alert.alert('Success', 'PDF downloaded successfully!');
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            dialogTitle: 'Share Attendance Report',
            mimeType: 'application/pdf'
          });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7726B9', '#5E1D9E']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>Month Report</Text>
      </LinearGradient>
      
      <View style={styles.printContainer}>
        <View style={styles.printHeader}>
          <Text style={styles.printSubtitle}>{getPeriodString()}</Text>
        </View>
        
        <ScrollView style={styles.printScroll}>
          <View style={styles.printTable}>
            <View style={styles.printTableHeader}>
              <Text style={styles.printHeaderCell}>Date</Text>
              <Text style={styles.printHeaderCell}>Time In</Text>
              <Text style={styles.printHeaderCell}>Time Out</Text>
              <Text style={styles.printHeaderCell}>Working Hours</Text>
              <Text style={styles.printHeaderCell}>Missed Time</Text>
              <Text style={styles.printHeaderCell}>Status</Text>
            </View>
            
            {printData.map((item, index) => (
              <View key={index} style={styles.printTableRow}>
                <Text style={styles.printCell}>{item.date}</Text>
                <Text style={styles.printCell}>{formatTime(item.timeIn)}</Text>
                <Text style={styles.printCell}>{formatTime(item.timeOut)}</Text>
                <Text style={styles.printCell}>{item.workingHours}</Text>
                <Text style={styles.printCell}>{item.missedTimes}</Text>
                <Text style={[
                  styles.printCell,
                  item.attendanceStatus === 'Present' ? styles.printPresentStatus : 
                  item.attendanceStatus === 'Absent' ? styles.printAbsentStatus : 
                  styles.printOtherStatus
                ]}>
                  {item.attendanceStatus}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
        
        <View style={styles.printFooter}>
          <Text style={styles.printFooterText}>Generated on {new Date().toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.modalButtons}>
          <TouchableOpacity 
            style={styles.downloadButton}
            onPress={generateAndSharePDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="picture-as-pdf" size={20} color="white" />
                <Text style={styles.downloadButtonText}>Download PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    paddingTop: 20,
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
  printContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  printHeader: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 16,
  },
  printSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#4a6da7',
    marginTop: 8,
  },
  printScroll: {
    flex: 1,
    maxHeight: 450,
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
  },
  printHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
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
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  downloadButton: {
    flex: 1,
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
  pdfTableCell: {
    // padding: '10px',
    // border: '1px solid #e0e0e0',
    textAlign: 'center',
  },
});

export default EmployeeAttendanceReport;