import BottomNavBar from '../components/BottomNavBar';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { format, formatDistanceToNow } from 'date-fns';
// import { format, formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useContext, useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Avatar, Button, Card, IconButton } from 'react-native-paper';
import { EmployeeContext } from '../context/EmployeeContext';




type Announcement = {
  id: number;
  title: string;
  message: string;
  postedBy: string;
  postedDate: string;
};

const AnnouncementBoard = () => {
  // const API_URL = 'http://192.168.1.15:8080/api/announcements';

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

const { employee, setEmployee, logout } = useContext(EmployeeContext);
const companyCode = employee?.companyCode; 
  useEffect(() => {
    fetchAnnouncements();
  }, []);


  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`http://192.168.1.15:8080/api/announcements`);
      setAnnouncements(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Failed to fetch announcements', error);
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };


  const filteredAnnouncements = announcements
    .filter(announcement => 
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.postedBy.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.postedDate).getTime();
      const dateB = new Date(b.postedDate).getTime();
      return dateB - dateA; // Newest first
    });


  const renderItem = ({ item }: { item: Announcement }) => (
    <TouchableOpacity onPress={() => {
      setSelectedAnnouncement(item);
      setModalVisible(true);
    }}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Avatar.Text 
              size={36} 
              label={item.postedBy.charAt(0).toUpperCase()} 
              style={styles.avatar}
            />
            <View style={styles.headerText}>
              <Text style={styles.postedBy}>{item.postedBy}</Text>
              <Text style={styles.postedDate}>
                {formatDistanceToNow(new Date(item.postedDate), { addSuffix: true })}
              </Text>
            </View>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text 
            style={styles.message} 
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {item.message}
          </Text>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button 
            onPress={() => {
              setSelectedAnnouncement(item);
              setModalVisible(true);
            }}
          >
            View Details
          </Button>
        </Card.Actions>
      </Card>
    </TouchableOpacity>
  );


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Company Announcements</Text>
        <View style={styles.headerIcons}>
          <IconButton
            icon={() => <MaterialIcons name="notifications" size={24} color="#333" />}
            onPress={() => {}}
          />
        </View>
      </View> */}
         <LinearGradient
             colors={['#7726B9', '#5E1D9E']}
              style={styles.header}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.headerTitle}>Announcements</Text>
              <Text style={styles.headerSubtitle}>All announcements know announcement</Text>
            </LinearGradient>


      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search announcements..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#999"
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <MaterialIcons name="close" size={20} color="#999" style={styles.searchIcon} />
          </TouchableOpacity>
        ) : null}
      </View>


      {/* Announcements List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading announcements...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAnnouncements}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6200ee']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="text-box-remove-outline" 
                size={60} 
                color="#ccc" 
              />
              <Text style={styles.emptyText}>
                {searchTerm ? 'No matching announcements found' : 'No announcements available'}
              </Text>
            </View>
          }
        />
      )}


      {/* Announcement Detail Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <IconButton
              icon={() => <Feather name="arrow-left" size={24} color="#333" />}
              onPress={() => setModalVisible(false)}
            />
            <Text style={styles.modalTitle}>Announcement Details</Text>
          </View>
          
          {selectedAnnouncement && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalCardHeader}>
                <Avatar.Text 
                  size={48} 
                  label={selectedAnnouncement.postedBy.charAt(0).toUpperCase()} 
                  style={styles.modalAvatar}
                />
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalPostedBy}>{selectedAnnouncement.postedBy}</Text>
                  <Text style={styles.modalPostedDate}>
                    {format(new Date(selectedAnnouncement.postedDate), 'MMMM dd, yyyy • hh:mm a')}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.modalTitleText}>{selectedAnnouncement.title}</Text>
              
              <Text style={styles.modalMessage}>{selectedAnnouncement.message}</Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
                  {/* <BottomNavBar /> */}
  <View style={{ flex: 1, paddingBottom: 80 }}>
  {/* Your page content here */}
  <BottomNavBar activeTab="" />
</View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  // headerTitle: {
  //   fontSize: 20,
  //   fontWeight: 'bold',
  //   color: '#333',
  // },
  headerIcons: {
    flexDirection: 'row',
  },
   anheader: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#333',
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: '#6200ee',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  postedBy: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  postedDate: {
    fontSize: 12,
    color: '#999',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    backgroundColor: '#6200ee',
    marginRight: 16,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalPostedBy: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalPostedDate: {
    fontSize: 14,
    color: '#999',
  },
  modalTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});


export default AnnouncementBoard;




