import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import apiClient from '../../api/apiClient';
import { useRoute } from '@react-navigation/native';

type Ticket = {
  id: number;
  job_code: string | null;
  phase_code: string | null;
  description?: string;
};

const TicketForm = () => {
  const route = useRoute<any>();
  const { supervisor_id, date } = route.params;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/tickets', {
        params: { supervisor_id, date },
      });
      setTickets(response.data);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.response?.data?.detail || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const renderTicket = ({ item }: { item: Ticket }) => (
    <View style={styles.ticketCard}>
      <Text style={styles.ticketId}>Ticket ID: {item.id}</Text>
      <Text>Job Code: {item.job_code || 'N/A'}</Text>
      <Text>Phase Code: {item.phase_code || 'N/A'}</Text>
      {item.description && <Text>Description: {item.description}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>
        Tickets for Supervisor ID {supervisor_id} on {new Date(date).toLocaleDateString()}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : tickets.length === 0 ? (
        <Text style={styles.emptyText}>No tickets found for this supervisor.</Text>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={item => item.id.toString()}
          renderItem={renderTicket}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 16 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  ticketCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  ticketId: { fontWeight: 'bold', marginBottom: 4 },
  emptyText: { marginTop: 50, textAlign: 'center', fontSize: 16, color: '#666' },
});

export default TicketForm;
