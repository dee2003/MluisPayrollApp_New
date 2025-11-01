// // import React, { useState, useCallback } from 'react';
// // import {
// //     View,
// //     Text,
// //     StyleSheet,
// //     TouchableOpacity,
// //     SafeAreaView,
// //     ScrollView,
// //     Image,
// //     ActivityIndicator,
// //     Dimensions,
// //     Alert,
// //     FlatList,
// //     // FIX 2: Import RefreshControl, as it's used inside the ScrollView in ReviewTickets
// //     RefreshControl 
// // } from 'react-native';
// // import { useAuth } from '../../context/AuthContext';
// // import { useFocusEffect } from '@react-navigation/native';
// // import Icon from 'react-native-vector-icons/Feather';
// // import axios from 'axios';
// // import { Timesheet } from '../../types';

// // const { width } = Dimensions.get('window');
// // const THUMBNAIL_HEIGHT = 150;

// // const API_BASE_URL = 'https://cb12ad463b90.ngrok-free.app'; 

// // // FIX 1: Added 'full: 9999' to the borderRadius object
// // const THEME = {
// //     colors: {
// //         primary: '#4A5C4D',
// //         backgroundLight: '#F8F7F2',
// //         contentLight: '#3D3D3D',
// //         subtleLight: '#797979',
// //         cardLight: '#FFFFFF',
// //         brandStone: '#8E8E8E',
// //         success: '#16A34A',
// //         border: '#E5E5E5',
// //     },
// //     fontFamily: { display: 'System' },
// //     borderRadius: { lg: 16, sm: 8, tiny: 6, full: 9999 }, // <-- FIXED: Added 'full' property
// // };

// // // --- Tickets Review Component ---
// // const ReviewTickets = ({ navigation }: { navigation: any }) => {
// //     const { user } = useAuth();
// //     const [imagesByDate, setImagesByDate] = useState<any[]>([]);
// //     const [fullImageUri, setFullImageUri] = useState<string | null>(null);
// //     const [isLoading, setIsLoading] = useState(false);

// //     const fetchTickets = async () => {
// //         if (!user) return;
// //         setIsLoading(true);
// //         try {
// //             const response = await axios.get(`${API_BASE_URL}/api/ocr/images-by-date/${user.id}`);
// //             const groups = response.data.imagesByDate || [];

// //             const processedGroups = groups.map((group: any) => {
// //                 const unsubmittedTickets = group.images.filter((ticket: any) => !ticket.submitted);
                
// //                 return {
// //                     ...group,
// //                     isFullySubmitted: unsubmittedTickets.length === 0,
// //                     unsubmittedTicketIds: unsubmittedTickets.map((ticket: any) => ticket.id),
// //                 };
// //             });

// //             setImagesByDate(processedGroups);
// //         } catch (err) {
// //             Alert.alert('Error', 'Failed to load tickets.');
// //             console.error(err);
// //         } finally {
// //             setIsLoading(false);
// //         }
// //     };

// //     useFocusEffect(useCallback(() => {
// //         fetchTickets();
// //     }, [user]));

// //     const handleSubmitTickets = async (date: string, unsubmittedTicketIds: number[]) => {
// //         if (!user) return;
// //         if (unsubmittedTicketIds.length === 0) {
// //             Alert.alert("No New Tickets", "All tickets for this date have already been submitted.");
// //             return;
// //         }

// //         try {
// //             await axios.post(`${API_BASE_URL}/api/submissions/`, {
// //                 date,
// //                 foreman_id: user.id,
// //                 ticket_ids: unsubmittedTicketIds,
// //             });
// //             Alert.alert("Success", `${unsubmittedTicketIds.length} new tickets for ${date} have been submitted.`);
// //             fetchTickets();
// //         } catch (e: any) {
// //             Alert.alert("Submission Error", e.response?.data?.detail || "An unexpected error occurred.");
// //         }
// //     };
    
// //     if (isLoading && imagesByDate.length === 0) {
// //         return <ActivityIndicator size="large" color={THEME.colors.primary} style={styles.centered} />;
// //     }

// //     return (
// //         <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={
// //             <RefreshControl 
// //                 refreshing={isLoading} 
// //                 onRefresh={fetchTickets} 
// //                 tintColor={THEME.colors.primary} 
// //                 progressViewOffset={20}
// //             />
// //         }>
// //             {imagesByDate.length === 0 ? (
// //                 <View style={styles.emptyContainer}>
// //                     <Icon name="camera" size={48} color={THEME.colors.brandStone} />
// //                     <Text style={styles.emptyText}>No tickets to review.</Text>
// //                     <Text style={styles.emptySubText}>Scanned tickets will appear here for submission.</Text>
// //                 </View>
// //             ) : (
// //                 imagesByDate.map(group => (
// //                     <View key={group.date} style={styles.card}>
// //                         <View style={styles.dateHeaderRow}>
// //                             <Text style={styles.dateTitle}>
// //                                 {new Date(group.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
// //                             </Text>
// //                             <Text style={styles.ticketCount}>{group.images.length} Tickets</Text>
// //                         </View>
                        
// //                         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailScrollContainer}>
// //                             {group.images.map((img: any) => (
// //                                 <TouchableOpacity key={img.id} style={styles.thumbnailWrapper} onPress={() => setFullImageUri(`${API_BASE_URL}${img.image_url}`)}>
// //                                     <Image source={{ uri: `${API_BASE_URL}${img.image_url}` }} style={styles.thumbnailImage} />
// //                                 </TouchableOpacity>
// //                             ))}
// //                         </ScrollView>
                        
// //                         <TouchableOpacity
// //                             style={[styles.submitButton, group.isFullySubmitted && styles.submitButtonDisabled]}
// //                             onPress={() => handleSubmitTickets(group.date, group.unsubmittedTicketIds)}
// //                             disabled={group.isFullySubmitted}
// //                         >
// //                             <Icon name={group.isFullySubmitted ? "check-circle" : "send"} size={18} color="#fff" />
// //                             <Text style={styles.submitButtonText}>
// //                                 {group.isFullySubmitted ? "All Submitted" : `Submit ${group.unsubmittedTicketIds.length} New Ticket${group.unsubmittedTicketIds.length !== 1 ? 's' : ''}`}
// //                             </Text>
// //                         </TouchableOpacity>
// //                     </View>
// //                 ))
// //             )}
            
// //             {/* Full Image Modal/Overlay */}
// //             {fullImageUri && (
// //                 <View style={styles.fullImageContainer}>
// //                     <Image source={{ uri: fullImageUri }} style={styles.fullImage} resizeMode="contain" />
// //                     <TouchableOpacity style={styles.closeButton} onPress={() => setFullImageUri(null)}>
// //                         <Icon name="x" size={28} color="#fff" />
// //                     </TouchableOpacity>
// //                 </View>
// //             )}
// //         </ScrollView>
// //     );
// // };


// // // --- Timesheets Review Component ---
// // const ReviewTimesheets = ({ navigation }: { navigation: any }) => {
// //     const { user } = useAuth();
// //     const [drafts, setDrafts] = useState<Timesheet[]>([]);
// //     const [loading, setLoading] = useState(false);

// //     const fetchDrafts = async () => {
// //         if (!user) return;
// //         setLoading(true);
// //         try {
// //             const response = await axios.get(`${API_BASE_URL}/api/timesheets/drafts/by-foreman/${user.id}`);
// //             setDrafts(response.data);
// //         } catch (e) {
// //             Alert.alert('Error', 'Failed to fetch draft timesheets.');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     useFocusEffect(useCallback(() => {
// //         fetchDrafts();
// //     }, [user]));

// // const handleSendTimesheet = async (timesheetId: number) => {
// //   Alert.alert("Confirm Submission", "Are you sure you want to send this timesheet?", [
// //     { text: "Cancel", style: "cancel" },
// //     {
// //       text: "Send",
// //       onPress: async () => {
// //         setLoading(true);
// //         try {
// //           await axios.post(`${API_BASE_URL}/api/timesheets/${timesheetId}/send`);
// //           Alert.alert("Success", "Timesheet has been sent.");

// //           // 🔥 1. Immediately remove from local state
// //           setDrafts((prev) => prev.filter((t) => t.id !== timesheetId));

// //           // 🔥 2. Notify TimesheetListScreen to refresh when navigating back
// //           navigation.navigate("TimesheetList", { refresh: true });
// //         } catch (error: any) {
// //           console.error("Send timesheet error:", error);
// //           Alert.alert("Error", error.response?.data?.detail || "Could not send the timesheet.");
// //         } finally {
// //           setLoading(false);
// //         }
// //       },
// //       style: "destructive",
// //     },
// //   ]);
// // };



// //     if (loading && drafts.length === 0) {
// //         return <ActivityIndicator size="large" color={THEME.colors.primary} style={styles.centered} />;
// //     }

// //     return (
// //         <FlatList
// //             data={drafts}
// //             keyExtractor={(item) => item.id.toString()}
// //             contentContainerStyle={styles.scrollContent}
// //             refreshControl={
// //                 <RefreshControl 
// //                     refreshing={loading} 
// //                     onRefresh={fetchDrafts} 
// //                     tintColor={THEME.colors.primary} 
// //                     progressViewOffset={20}
// //                 />
// //             }
// //             renderItem={({ item }) => (
// //                 <View style={styles.tsItemOuterContainer}>
// //                     <TouchableOpacity 
// //                         style={styles.tsItemContainer} 
// //                         onPress={() => navigation.navigate('TimesheetEdit', { timesheetId: item.id })}
// //                     >
// //                         <View style={styles.tsItemTextContainer}>
// //                             <Text style={styles.tsItemTitle}>{item.timesheet_name || 'Untitled Timesheet'}</Text>
// //                             <Text style={styles.tsItemSubtitle}>Date: {new Date(item.date).toLocaleDateString()}</Text>
// //                         </View>
// //                     </TouchableOpacity>
// //                     <TouchableOpacity style={styles.tsSendButton} onPress={() => handleSendTimesheet(item.id)}>
// //                         <Icon name="send" size={20} color={THEME.colors.primary} />
// //                         <Text style={styles.tsSendButtonText}>Send</Text>
// //                     </TouchableOpacity>
// //                 </View>
// //             )}
// //             ListEmptyComponent={
// //                 <View style={styles.emptyContainer}>
// //                     <Icon name="edit" size={48} color={THEME.colors.brandStone} />
// //                     <Text style={styles.emptyText}>No timesheet drafts.</Text>
// //                     <Text style={styles.emptySubText}>Saved timesheets will appear here for submission.</Text>
// //                 </View>
// //             }
// //         />
// //     );
// // };


// // // --- Main Review Screen with Tabs ---
// // const ReviewScreen = ({ navigation }: { navigation: any }) => {
// //     const [activeTab, setActiveTab] = useState<'tickets' | 'timesheets'>('tickets');

// //     return (
// //         <SafeAreaView style={styles.container}>
// //             <View style={styles.header}>
// //                 <View style={styles.tabContainer}>
// //                     <TouchableOpacity
// //                         style={[styles.tab, activeTab === 'tickets' && styles.activeTab]}
// //                         onPress={() => setActiveTab('tickets')}
// //                     >
// //                         <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>Tickets</Text>
// //                     </TouchableOpacity>
// //                     <TouchableOpacity
// //                         style={[styles.tab, activeTab === 'timesheets' && styles.activeTab]}
// //                         onPress={() => setActiveTab('timesheets')}
// //                     >
// //                         <Text style={[styles.tabText, activeTab === 'timesheets' && styles.activeTabText]}>Timesheets</Text>
// //                     </TouchableOpacity>
// //                 </View>
// //             </View>

// //             {activeTab === 'tickets' ? (
// //                 <ReviewTickets navigation={navigation} />
// //             ) : (
// //                 <ReviewTimesheets navigation={navigation} />
// //             )}
// //         </SafeAreaView>
// //     );
// // };


// // const styles = StyleSheet.create({
// //     // General
// //     container: { flex: 1, backgroundColor: THEME.colors.backgroundLight },
// //     centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.colors.backgroundLight },
// //     scrollContent: { padding: 16, flexGrow: 1 },

// //     // Header & Tabs
// //     header: {
// //         paddingHorizontal: 16,
// //         paddingBottom: 16,
// //         paddingTop: 8,
// //         backgroundColor: THEME.colors.cardLight,
// //         borderBottomWidth: 1,
// //         borderBottomColor: THEME.colors.border,
// //     },
// //     tabContainer: {
// //         flexDirection: 'row',
// //         backgroundColor: THEME.colors.border,
// //         borderRadius: THEME.borderRadius.sm,
// //         padding: 4,
// //     },
// //     tab: {
// //         flex: 1,
// //         paddingVertical: 10,
// //         alignItems: 'center',
// //         borderRadius: THEME.borderRadius.tiny,
// //     },
// //     activeTab: {
// //         backgroundColor: THEME.colors.cardLight,
// //         shadowColor: '#000',
// //         shadowOffset: { width: 0, height: 1 },
// //         shadowOpacity: 0.1,
// //         shadowRadius: 2,
// //         elevation: 3,
// //     },
// //     tabText: {
// //         fontFamily: THEME.fontFamily.display,
// //         fontSize: 15,
// //         fontWeight: '600',
// //         color: THEME.colors.subtleLight,
// //     },
// //     activeTabText: {
// //         color: THEME.colors.primary,
// //     },

// //     // Card (Tickets)
// //     card: {
// //         marginBottom: 20,
// //         backgroundColor: THEME.colors.cardLight,
// //         borderRadius: THEME.borderRadius.lg,
// //         padding: 16,
// //         shadowColor: '#000',
// //         shadowOffset: { width: 0, height: 2 },
// //         shadowOpacity: 0.05,
// //         shadowRadius: 8,
// //         elevation: 4,
// //     },
// //     dateHeaderRow: { 
// //         flexDirection: 'row', 
// //         justifyContent: 'space-between', 
// //         alignItems: 'center', 
// //         marginBottom: 12 
// //     },
// //     dateTitle: { 
// //         fontFamily: THEME.fontFamily.display,
// //         fontSize: 17, 
// //         fontWeight: '700', 
// //         color: THEME.colors.contentLight 
// //     },
// //     ticketCount: { 
// //         fontFamily: THEME.fontFamily.display,
// //         fontSize: 13, 
// //         fontWeight: '500', 
// //         color: THEME.colors.contentLight, 
// //         backgroundColor: THEME.colors.backgroundLight, 
// //         paddingHorizontal: 10, 
// //         paddingVertical: 4, 
// //         borderRadius: THEME.borderRadius.sm,
// //     },
// //     thumbnailScrollContainer: { 
// //         paddingVertical: 8,
// //         paddingHorizontal: 0,
// //     },
// //     thumbnailWrapper: { 
// //         height: THUMBNAIL_HEIGHT, 
// //         width: width * 0.28, 
// //         marginRight: 12, 
// //         borderRadius: THEME.borderRadius.sm, 
// //         borderWidth: 1, 
// //         borderColor: THEME.colors.border, 
// //         overflow: 'hidden', 
// //         backgroundColor: THEME.colors.backgroundLight
// //     },
// //     thumbnailImage: { 
// //         height: '100%', 
// //         width: '100%' 
// //     },

// //     // Submit Button
// //     submitButton: { 
// //         flexDirection: 'row', 
// //         alignItems: 'center', 
// //         justifyContent: 'center', 
// //         backgroundColor: THEME.colors.success, 
// //         paddingVertical: 12, 
// //         borderRadius: THEME.borderRadius.sm, 
// //         marginTop: 16 
// //     },
// //     submitButtonDisabled: { 
// //         backgroundColor: THEME.colors.brandStone 
// //     },
// //     submitButtonText: { 
// //         fontFamily: THEME.fontFamily.display,
// //         color: THEME.colors.cardLight, 
// //         fontSize: 16, 
// //         fontWeight: '600', 
// //         marginLeft: 8 
// //     },

// //     // Full Image Modal/Overlay
// //     fullImageContainer: { 
// //         ...StyleSheet.absoluteFillObject, 
// //         backgroundColor: 'rgba(0, 0, 0, 0.95)', 
// //         justifyContent: 'center', 
// //         alignItems: 'center',
// //         zIndex: 100
// //     },
// //     fullImage: { 
// //         width: '95%', 
// //         height: '85%' 
// //     },
// //     closeButton: { 
// //         position: 'absolute', 
// //         top: 50, 
// //         right: 20, 
// //         backgroundColor: 'rgba(0, 0, 0, 0.4)', 
// //         borderRadius: THEME.borderRadius.full, // <-- FIXED: 'full' is now defined
// //         padding: 10 
// //     },

// //     // Empty State
// //     emptyContainer: {
// //         flex: 1,
// //         justifyContent: 'center',
// //         alignItems: 'center',
// //         paddingTop: 80,
// //         paddingHorizontal: 40,
// //     },
// //     emptyText: { 
// //         fontFamily: THEME.fontFamily.display,
// //         marginTop: 16, 
// //         fontSize: 17, 
// //         fontWeight: '600', 
// //         color: THEME.colors.subtleLight 
// //     },
// //     emptySubText: { 
// //         fontFamily: THEME.fontFamily.display,
// //         marginTop: 8, 
// //         fontSize: 14, 
// //         color: THEME.colors.brandStone, 
// //         textAlign: 'center' 
// //     },

// //     // Timesheet list styles
// //     tsItemOuterContainer: { 
// //         flexDirection: 'row', 
// //         alignItems: 'center', 
// //         backgroundColor: THEME.colors.cardLight, 
// //         borderRadius: THEME.borderRadius.sm, 
// //         marginBottom: 12, 
// //         shadowColor: '#000', 
// //         shadowOffset: { width: 0, height: 1 }, 
// //         shadowOpacity: 0.05, 
// //         shadowRadius: 4, 
// //         elevation: 2, 
// //     },
// //     tsItemContainer: { 
// //         flex: 1, 
// //         padding: 16 
// //     },
// //     tsItemTextContainer: { 
// //         flex: 1 
// //     },
// //     tsItemTitle: { 
// //         fontFamily: THEME.fontFamily.display,
// //         fontSize: 16, 
// //         fontWeight: '600', 
// //         color: THEME.colors.contentLight 
// //     },
// //     tsItemSubtitle: { 
// //         fontFamily: THEME.fontFamily.display,
// //         fontSize: 14, 
// //         color: THEME.colors.subtleLight, 
// //         marginTop: 4 
// //     },
// //     tsSendButton: { 
// //         flexDirection: 'row', 
// //         alignItems: 'center', 
// //         paddingHorizontal: 20, 
// //         paddingVertical: 20, 
// //         borderLeftWidth: 1, 
// //         borderLeftColor: THEME.colors.border, 
// //     },
// //     tsSendButtonText: { 
// //         fontFamily: THEME.fontFamily.display,
// //         marginLeft: 8, 
// //         color: THEME.colors.primary, 
// //         fontWeight: '600', 
// //         fontSize: 16, 
// //     },
// // });

// // export default ReviewScreen;


// import React, { useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   SafeAreaView,
//   ScrollView,
//   Image,
//   ActivityIndicator,
//   Dimensions,
//   Alert,
//   RefreshControl,
//   Modal,
// } from "react-native";
// import { useAuth } from "../../context/AuthContext";
// import { useFocusEffect } from "@react-navigation/native";
// import Icon from "react-native-vector-icons/Feather";
// import axios from "axios";

// const { width } = Dimensions.get("window");
// const THUMBNAIL_HEIGHT = 150;

// // ✅ Replace with your backend ngrok or production URL
// const API_BASE_URL = "https://cb12ad463b90.ngrok-free.app";

// // ✅ Convert backend file path to accessible URL
// const getImageUri = (imagePath?: string): string | null => {
//   if (!imagePath) return null;
//   if (imagePath.startsWith("http")) return imagePath;
//   const filename = imagePath.split("\\").pop()?.split("/").pop();
//   return `${API_BASE_URL}/media/tickets/${filename}`;
// };

// interface TicketImage {
//   id: number;
//   image_url: string;
//   submitted: boolean;
// }

// interface TicketGroup {
//   date: string;
//   images: TicketImage[];
//   status?: string;
//   submission_id?: number;
//   ticket_count?: number;
//   isFullySubmitted?: boolean;
//   unsubmittedTicketIds?: number[];
// }

// const ReviewScreen: React.FC = () => {
//   const { user } = useAuth();
//   const [imagesByDate, setImagesByDate] = useState<TicketGroup[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [fullImageUri, setFullImageUri] = useState<string | null>(null);

//   // ✅ Fetch tickets
//   const fetchTickets = async () => {
//     if (!user) return;
//     setIsLoading(true);
//     try {
//       const res = await axios.get(`${API_BASE_URL}/api/ocr/images-by-date/${user.id}`);
//       const groups: TicketGroup[] = res.data.imagesByDate || [];

//       const processed = groups.map((g) => {
//         const unsubmitted = g.images.filter((i) => !i.submitted);
//         return {
//           ...g,
//           isFullySubmitted: unsubmitted.length === 0,
//           unsubmittedTicketIds: unsubmitted.map((i) => i.id),
//         };
//       });

//       setImagesByDate(processed);
//     } catch (err) {
//       console.error("fetchTickets error:", err);
//       Alert.alert("Error", "Failed to load tickets.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       fetchTickets();
//     }, [user])
//   );

//   // ✅ Submit tickets for one date
//   const handleSubmitTickets = async (date: string, ticketIds: number[]) => {
//     if (!ticketIds.length) {
//       Alert.alert("No pending tickets", "All tickets already submitted.");
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const res = await axios.post(`${API_BASE_URL}/api/tickets/submit`, {
//         ticket_ids: ticketIds,
//       });

//       if (res.status === 200) {
//         Alert.alert("Success", "Tickets submitted successfully!");
//         fetchTickets();
//       }
//     } catch (err) {
//       console.error("submit error:", err);
//       Alert.alert("Error", "Failed to submit tickets.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={THEME.colors.primary} />
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView
//         contentContainerStyle={styles.scrollContent}
//         refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchTickets} />}
//       >
//         {imagesByDate.map((group) => (
//           <View key={group.date} style={styles.groupContainer}>
//             <View style={styles.headerRow}>
//               <Text style={styles.dateText}>{group.date}</Text>
//               <TouchableOpacity
//                 style={[
//                   styles.submitButton,
//                   group.isFullySubmitted && { backgroundColor: THEME.colors.success },
//                 ]}
//                 onPress={() =>
//                   handleSubmitTickets(group.date, group.unsubmittedTicketIds || [])
//                 }
//                 disabled={group.isFullySubmitted}
//               >
//                 <Text style={styles.submitButtonText}>
//                   {group.isFullySubmitted ? "All Submitted" : "Submit"}
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScrollContainer}>
//               {group.images.map((img) => {
//                 const imgUri = getImageUri(img.image_url);
//                 return (
//                   <TouchableOpacity
//                     key={img.id}
//                     onPress={() => imgUri && setFullImageUri(imgUri)}
//                   >
//                     <Image
//                       source={
//                         imgUri
//                           ? { uri: imgUri }
//                           : undefined
//                       }
//                       style={[
//                         styles.thumbnailImage,
//                         !imgUri && { backgroundColor: "#ccc" }, // ✅ fallback gray
//                       ]}
//                       resizeMode="cover"
//                     />
//                     {!img.submitted && (
//                       <View style={styles.pendingBadge}>
//                         <Text style={styles.pendingBadgeText}>Pending</Text>
//                       </View>
//                     )}
//                   </TouchableOpacity>
//                 );
//               })}
//             </ScrollView>
//           </View>
//         ))}
//       </ScrollView>

//       {/* ✅ Full Image Modal */}
//       <Modal visible={!!fullImageUri} transparent animationType="fade">
//         <View style={styles.modalContainer}>
//           <TouchableOpacity style={styles.closeButton} onPress={() => setFullImageUri(null)}>
//             <Icon name="x" size={28} color="#fff" />
//           </TouchableOpacity>
//           <Image
//             source={{ uri: fullImageUri || "" }}
//             style={styles.fullImage}
//             resizeMode="contain"
//           />
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// // ✅ Styling
// const THEME = {
//   colors: {
//     primary: "#4A5C4D",
//     backgroundLight: "#F8F7F2",
//     contentLight: "#3D3D3D",
//     border: "#E5E5E5",
//     success: "#16A34A",
//     pending: "#FACC15",
//   },
//   radius: { sm: 8, md: 12, lg: 16 },
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: THEME.colors.backgroundLight },
//   scrollContent: { padding: 16 },
//   centered: { flex: 1, justifyContent: "center", alignItems: "center" },
//   groupContainer: {
//     backgroundColor: "#fff",
//     borderRadius: THEME.radius.md,
//     marginBottom: 16,
//     padding: 12,
//     shadowColor: "#000",
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   headerRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   dateText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: THEME.colors.contentLight,
//   },
//   submitButton: {
//     backgroundColor: THEME.colors.primary,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: THEME.radius.sm,
//   },
//   submitButtonText: { color: "#fff", fontWeight: "500" },
//   thumbnailScrollContainer: { flexDirection: "row" },
//   thumbnailImage: {
//     width: width / 3,
//     height: THUMBNAIL_HEIGHT,
//     borderRadius: THEME.radius.sm,
//     marginRight: 8,
//     backgroundColor: "#ddd",
//   },
//   pendingBadge: {
//     position: "absolute",
//     bottom: 6,
//     right: 6,
//     backgroundColor: THEME.colors.pending,
//     borderRadius: 6,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//   },
//   pendingBadgeText: { color: "#000", fontSize: 10, fontWeight: "bold" },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.9)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   fullImage: { width: "100%", height: "90%" },
//   closeButton: {
//     position: "absolute",
//     top: 40,
//     right: 20,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     borderRadius: 20,
//     padding: 6,
//     zIndex: 10,
//   },
// });

// export default ReviewScreen;

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import axios from "axios";
import { Timesheet } from "../../types";

const { width } = Dimensions.get("window");
const THUMBNAIL_HEIGHT = 150;

// ✅ Replace with your backend ngrok or production URL
const API_BASE_URL = " https://coated-nonattributive-babara.ngrok-free.dev";

// --- TYPE DEFINITIONS ---
interface TicketImage {
  id: number;
  image_url: string;
  submitted: boolean;
}

interface TicketGroup {
  date: string;
  images: TicketImage[];
  status?: string;
  submission_id?: number;
  ticket_count?: number;
  isFullySubmitted?: boolean;
  unsubmittedTicketIds?: number[];
}

// ✅ Convert backend file path to accessible URL
const getImageUri = (imagePath?: string): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  const filename = imagePath.split("\\").pop()?.split("/").pop();
  return `${API_BASE_URL}/media/tickets/${filename}`;
};

// --- Tickets Review Component (Original Logic) ---
const ReviewTickets: React.FC = () => {
  const { user } = useAuth();
  const [imagesByDate, setImagesByDate] = useState<TicketGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fullImageUri, setFullImageUri] = useState<string | null>(null);

  const fetchTickets = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/ocr/images-by-date/${user.id}`
      );
      const groups: TicketGroup[] = res.data.imagesByDate || [];

      const processed = groups.map((g) => {
        const unsubmitted = g.images.filter((i) => !i.submitted);
        return {
          ...g,
          isFullySubmitted: unsubmitted.length === 0,
          unsubmittedTicketIds: unsubmitted.map((i) => i.id),
        };
      });

      setImagesByDate(processed);
    } catch (err) {
      console.error("fetchTickets error:", err);
      Alert.alert("Error", "Failed to load tickets.");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [user])
  );

  const handleSubmitTickets = async (date: string, ticketIds: number[]) => {
    if (!ticketIds || ticketIds.length === 0) {
      Alert.alert("No pending tickets", "All tickets for this date are already submitted.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(`${API_BASE_URL}/api/tickets/submit`, {
        ticket_ids: ticketIds,
      });

      if (res.status === 200) {
        Alert.alert("Success", "Tickets submitted successfully!");
        fetchTickets();
      }
    } catch (err) {
      console.error("submit error:", err);
      Alert.alert("Error", "Failed to submit tickets.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && imagesByDate.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchTickets} />
        }
      >
        {imagesByDate.length === 0 && !isLoading ? (
             <View style={styles.emptyContainer}>
                 <Icon name="camera" size={48} color={THEME.colors.brandStone} />
                 <Text style={styles.emptyText}>No tickets to review.</Text>
                 <Text style={styles.emptySubText}>Scanned tickets will appear here for submission.</Text>
             </View>
        ) : (
            imagesByDate.map((group) => (
              <View key={group.date} style={styles.groupContainer}>
                <View style={styles.headerRow}>
                  <Text style={styles.dateText}>{group.date}</Text>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      group.isFullySubmitted && { backgroundColor: THEME.colors.success },
                    ]}
                    onPress={() =>
                      handleSubmitTickets(group.date, group.unsubmittedTicketIds || [])
                    }
                    disabled={group.isFullySubmitted}
                  >
                    <Text style={styles.submitButtonText}>
                      {group.isFullySubmitted ? "All Submitted" : "Submit"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.thumbnailScrollContainer}
                >
                  {group.images.map((img) => {
                    const imgUri = getImageUri(img.image_url);
                    return (
                      <TouchableOpacity
                        key={img.id}
                        onPress={() => imgUri && setFullImageUri(imgUri)}
                      >
                        <Image
                          source={imgUri ? { uri: imgUri } : undefined}
                          style={[
                            styles.thumbnailImage,
                            !imgUri && { backgroundColor: "#ccc" },
                          ]}
                          resizeMode="cover"
                        />
                        {!img.submitted && (
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>Pending</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ))
        )}
      </ScrollView>

      <Modal visible={!!fullImageUri} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFullImageUri(null)}
          >
            <Icon name="x" size={28} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: fullImageUri || "" }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

// --- Timesheets Review Component ---
const ReviewTimesheets = ({ navigation }: { navigation: any }) => {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDrafts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/timesheets/drafts/by-foreman/${user.id}`
      );
      setDrafts(response.data);
    } catch (e) {
      Alert.alert("Error", "Failed to fetch draft timesheets.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDrafts();
    }, [user])
  );

  const handleSendTimesheet = async (timesheetId: number) => {
    Alert.alert(
      "Confirm Submission",
      "Are you sure you want to send this timesheet?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            setLoading(true);
            try {
              await axios.post(
                `${API_BASE_URL}/api/timesheets/${timesheetId}/send`
              );
              Alert.alert("Success", "Timesheet has been sent.");
              setDrafts((prev) => prev.filter((t) => t.id !== timesheetId));
              navigation.navigate("TimesheetList", { refresh: true });
            } catch (error: any) {
              console.error("Send timesheet error:", error);
              Alert.alert(
                "Error",
                error.response?.data?.detail || "Could not send the timesheet."
              );
            } finally {
              setLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  if (loading && drafts.length === 0) {
    return <ActivityIndicator size="large" color={THEME.colors.primary} style={styles.centered} />;
  }

  return (
    <FlatList
      data={drafts}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={fetchDrafts}
          tintColor={THEME.colors.primary}
        />
      }
      renderItem={({ item }) => (
        <View style={styles.tsItemOuterContainer}>
          <TouchableOpacity
            style={styles.tsItemContainer}
            onPress={() =>
              navigation.navigate("TimesheetEdit", { timesheetId: item.id })
            }
          >
            <View style={styles.tsItemTextContainer}>
              <Text style={styles.tsItemTitle}>
                {item.timesheet_name || "Untitled Timesheet"}
              </Text>
              <Text style={styles.tsItemSubtitle}>
                Date: {new Date(item.date).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tsSendButton}
            onPress={() => handleSendTimesheet(item.id)}
          >
            <Icon name="send" size={20} color={THEME.colors.primary} />
            <Text style={styles.tsSendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Icon name="edit" size={48} color={THEME.colors.brandStone} />
          <Text style={styles.emptyText}>No timesheet drafts.</Text>
          <Text style={styles.emptySubText}>
            Saved timesheets will appear here for submission.
          </Text>
        </View>
      }
    />
  );
};

// --- Main Review Screen with Tabs ---
const ReviewScreen = ({ navigation }: { navigation: any }) => {
  const [activeTab, setActiveTab] = useState<"tickets" | "timesheets">("tickets");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "tickets" && styles.activeTab]}
            onPress={() => setActiveTab("tickets")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "tickets" && styles.activeTabText,
              ]}
            >
              Tickets
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "timesheets" && styles.activeTab]}
            onPress={() => setActiveTab("timesheets")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "timesheets" && styles.activeTabText,
              ]}
            >
              Timesheets
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "tickets" ? (
        <ReviewTickets />
      ) : (
        <ReviewTimesheets navigation={navigation} />
      )}
    </SafeAreaView>
  );
};

// ✅ Styling (Merged)
const THEME = {
  colors: {
    primary: "#4A5C4D",
    backgroundLight: "#F8F7F2",
    contentLight: "#3D3D3D",
    subtleLight: '#797979',
    cardLight: '#FFFFFF',
    border: "#E5E5E5",
    brandStone: '#8E8E8E',
    success: "#16A34A",
    pending: "#FACC15",
  },
  fontFamily: { display: 'System' },
  borderRadius: { sm: 8, md: 12, lg: 16, tiny: 6, full: 9999 },
};

const styles = StyleSheet.create({
  // General & Layout
  container: { flex: 1, backgroundColor: THEME.colors.backgroundLight },
  scrollContent: { padding: 16, flexGrow: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header & Tabs
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: THEME.colors.cardLight,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.sm,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.tiny,
  },
  activeTab: {
    backgroundColor: THEME.colors.cardLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  tabText: {
    fontFamily: THEME.fontFamily.display,
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.subtleLight,
  },
  activeTabText: {
    color: THEME.colors.primary,
  },

  // Tickets Styling (from original code)
  groupContainer: {
    backgroundColor: "#fff",
    borderRadius: THEME.borderRadius.md,
    marginBottom: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.contentLight,
  },
  submitButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
  },
  submitButtonText: { color: "#fff", fontWeight: "500" },
  thumbnailScrollContainer: { flexDirection: "row" },
  thumbnailImage: {
    width: width / 3,
    height: THUMBNAIL_HEIGHT,
    borderRadius: THEME.borderRadius.sm,
    marginRight: 8,
    backgroundColor: "#ddd",
  },
  pendingBadge: {
    position: "absolute",
    bottom: 6,
    right: 14, // Adjusted for better visibility
    backgroundColor: THEME.colors.pending,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pendingBadgeText: { color: "#000", fontSize: 10, fontWeight: "bold" },
  
  // Modal Styling
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: { width: "100%", height: "90%" },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  
  // Empty State Styling
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontFamily: THEME.fontFamily.display,
    marginTop: 16,
    fontSize: 17,
    fontWeight: '600',
    color: THEME.colors.subtleLight,
  },
  emptySubText: {
    fontFamily: THEME.fontFamily.display,
    marginTop: 8,
    fontSize: 14,
    color: THEME.colors.brandStone,
    textAlign: 'center',
  },

  // Timesheet List Styling
  tsItemOuterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardLight,
    borderRadius: THEME.borderRadius.sm,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tsItemContainer: {
    flex: 1,
    padding: 16,
  },
  tsItemTextContainer: {
    flex: 1,
  },
  tsItemTitle: {
    fontFamily: THEME.fontFamily.display,
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.contentLight,
  },
  tsItemSubtitle: {
    fontFamily: THEME.fontFamily.display,
    fontSize: 14,
    color: THEME.colors.subtleLight,
    marginTop: 4,
  },
  tsSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderLeftWidth: 1,
    borderLeftColor: THEME.colors.border,
  },
  tsSendButtonText: {
    fontFamily: THEME.fontFamily.display,
    marginLeft: 8,
    color: THEME.colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ReviewScreen;

