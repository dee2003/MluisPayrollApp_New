// // src/screens/projectEngineer/ProjectEngineerTimesheetViewScreen.tsx
// import React, { useEffect, useState } from 'react';
// import { View, Text, ScrollView, ActivityIndicator, StyleSheet, SafeAreaView, Alert } from 'react-native';
// import { RouteProp, useRoute } from '@react-navigation/native';
// import apiClient from '../../api/apiClient';
// import type { ProjectEngineerStackParamList } from '../../navigation/AppNavigator';

// type RoutePropType = RouteProp<ProjectEngineerStackParamList, 'ProjectEngineerTimesheetView'>;

// type TimesheetDetail = {
//   id: number;
//   foreman_id?: number;
//   foreman_name?: string;
//   date: string;
//   data?: any; // adapt shape if you have a structure for job rows
//   total_hours?: number;
//   status?: string;
// };

// const ProjectEngineerTimesheetViewScreen = () => {
//   const route = useRoute<RoutePropType>();
//   const { timesheetId } = route.params;
//   const [loading, setLoading] = useState(true);
//   const [ts, setTs] = useState<TimesheetDetail | null>(null);

//   useEffect(() => {
//     const fetch = async () => {
//       setLoading(true);
//       try {
//         const res = await apiClient.get<TimesheetDetail>(`/api/timesheets/${timesheetId}`);
//         setTs(res.data);
//       } catch (err: any) {
//         console.error(err);
//         Alert.alert('Error', 'Could not load timesheet.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetch();
//   }, [timesheetId]);

//   if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
//   if (!ts) return <View style={styles.center}><Text>Timesheet not found.</Text></View>;

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView contentContainerStyle={{ padding: 16 }}>
//         <Text style={styles.title}>Timesheet #{ts.id}</Text>
//         <Text style={styles.subtitle}>Date: {ts.date}</Text>
//         <Text style={styles.meta}>Foreman: {ts.foreman_name ?? ts.foreman_id}</Text>
//         <Text style={styles.sectionTitle}>Summary</Text>
//         <Text>Total hours: {ts.total_hours ?? '-'}</Text>

//         <Text style={styles.sectionTitle}>Details</Text>
//         <View style={styles.box}>
//           <Text>{JSON.stringify(ts.data, null, 2)}</Text>
//         </View>
//         <Text style={{ marginTop: 12 }}>Status: {ts.status ?? 'N/A'}</Text>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F2F2F7' },
//   center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
//   title: { fontWeight: '700', fontSize: 18, marginBottom: 6 },
//   subtitle: { color: '#666', marginBottom: 6 },
//   meta: { color: '#333', marginBottom: 12 },
//   sectionTitle: { fontWeight: '600', marginTop: 12, marginBottom: 6 },
//   box: { backgroundColor: '#fff', padding: 12, borderRadius: 8 },
// });

// export default ProjectEngineerTimesheetViewScreen;
