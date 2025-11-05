import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import apiClient from '../../api/apiClient';
import { useRoute } from '@react-navigation/native';

type Timesheet = {
  id: number;
  job_phase_id: number | null;
  status: string;
  details?: string;
};

const TimesheetForm = () => {
  const route = useRoute<any>();
  const { supervisor_id, date } = route.params;

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTimesheets();
  }, []);

  const loadTimesheets = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/timesheets', {
        params: { supervisor_id, date },
      });
      setTimesheets(response.data);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.detail || 'Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  const renderTimesheet = ({ item }: { item: Timesheet }) => (
    <View style={styles.card}>
      <Text style={styles.id}>Timesheet ID: {item.id}</Text>
      <Text>Job Phase ID: {item.job_phase_id || 'N/A'}</Text>
      <Text>Status: {item.status}</Text>
      {item.details && <Text>Details: {item.details}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>
        Timesheets for Supervisor ID {supervisor_id} on {new Date(date).toLocaleDateString()}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : timesheets.length === 0 ? (
        <Text style={styles.emptyText}>No timesheets found for this supervisor.</Text>
      ) : (
        <FlatList
          data={timesheets}
          keyExtractor={item => item.id.toString()}
          renderItem={renderTimesheet}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 16 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, elevation: 2 },
  id: { fontWeight: 'bold', marginBottom: 4 },
  emptyText: { marginTop: 50, textAlign: 'center', fontSize: 16, color: '#666' },
});

export default TimesheetForm;
