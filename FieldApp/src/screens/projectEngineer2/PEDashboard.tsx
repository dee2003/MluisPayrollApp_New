import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation, CommonActions, NavigationProp } from '@react-navigation/native';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Define the navigation prop type for type safety
type ProjectEngineerNavigationProp = NavigationProp<RootStackParamList>;

// Interfaces to define the shape of our data
interface SubmissionDetails {
  foreman_id: number;
  foreman_name: string;
  job_code?: string;
  timesheet_count: number;
  ticket_count: number;
}

interface SectionData {
  title: string; // The date
  data: SubmissionDetails[];
}

// A centralized color palette
const COLORS = {
  primary: '#007AFF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  border: '#E5E5EA',
  danger: '#FF3B30',
};

const ProjectEngineerDashboard = () => {
  const navigation = useNavigation<ProjectEngineerNavigationProp>();
  const { logout } = useAuth();
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Memoized function to fetch data from the backend
  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/project-engineer/daily-submissions');
      // Map API response to the format required by SectionList
      const formattedData = response.data.map((group: any) => ({
        title: group.date,
        data: group.submissions,
      }));
      setSections(formattedData);
    } catch (error: any) {
      console.error('Failed to load submissions:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubmissions();
    setRefreshing(false);
  };

  const handleLogout = () => {
    logout();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  };

  if (loading && !refreshing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Engineer Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.foreman_id}-${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No Approved Submissions</Text>
            <Text style={styles.emptySubText}>Submissions approved by supervisors will appear here.</Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.dateGroupContainer}>
            <Text style={styles.dateHeader}>{new Date(title + 'T00:00:00').toLocaleDateString()}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.submissionItem}>
            <View style={styles.itemHeader}>
              <Text style={styles.foremanName}>
                <Ionicons name="person" size={18} /> {item.foreman_name}
              </Text>
              {item.job_code && (
                <Text style={styles.jobCodeRight}>Job: {item.job_code}</Text>
              )}
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.detailText}>Timesheets: {item.timesheet_count}</Text>
              <Text style={styles.detailText}>Tickets: {item.ticket_count}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  logoutButton: { backgroundColor: '#FF3B301A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  logoutButtonText: { color: COLORS.danger, fontWeight: '600', fontSize: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateGroupContainer: { backgroundColor: '#e9ecef', paddingVertical: 10, paddingHorizontal: 16 },
  dateHeader: { fontSize: 18, fontWeight: '700', color: '#495057' },
  submissionItem: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 10,
  },
  foremanName: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary },
  jobCodeRight: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-evenly', paddingTop: 5 },
  detailText: { fontSize: 16, color: COLORS.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '30%' },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary, marginTop: 16 },
  emptySubText: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
});

export default ProjectEngineerDashboard;
