import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Image,
    Modal,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/apiClient';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ProjectEngineerStackParamList } from '../../navigation/AppNavigator';

// Adapted Theme and Colors from PE Dashboard
const THEME = {
    colors: {
        primary: '#4A5C4D', // Primary action color (dark green)
        backgroundLight: '#F8F7F2', // Light background
        contentLight: '#3D3D3D', // Primary text content
        subtleLight: '#797979', // Secondary text content
        cardLight: '#FFFFFF', // Card/container background
        brandStone: '#8E8E8E', // Subtle brand color
        danger: '#FF3B30', // Danger/Close button
        border: '#E5E5E5', // Light border
    },
    fontFamily: { display: 'System' },
    borderRadius: { lg: 16, sm: 8, full: 9999 },
};

type Ticket = {
    id: number;
    image_path: string;
    phase_code?: string;
};

type RouteParams = RouteProp<ProjectEngineerStackParamList, 'PETicketList'>;

const { width } = Dimensions.get('window');
// Adjusted size for a 2-column grid with 16px horizontal padding and 10px spacing
const HORIZONTAL_PADDING = 16; 
const COLUMN_SPACING = 10;
const IMAGE_SIZE = (width - HORIZONTAL_PADDING * 2 - COLUMN_SPACING) / 2;

const PETicketList = () => {
    const route = useRoute<RouteParams>();
    const { foremanId, date, supervisorName } = route.params;

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(
                `/api/review/pe/tickets?foreman_id=${foremanId}&date=${date}`
            );
            setTickets(res.data);
        } catch (error: any) {
            console.error('Failed to load tickets:', error);
            Alert.alert('Error', error.response?.data?.detail || 'Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTickets();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTickets();
        setRefreshing(false);
    };

    const openModal = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setModalVisible(true);
    };

    const closeModal = () => {
        setSelectedTicket(null);
        setModalVisible(false);
    };

    if (loading && tickets.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    // Header component for consistency with other themed screens
    // const ListHeader = () => (
    //     <View style={styles.listHeader}>
    //         <Text style={styles.headerTitle}>Tickets for {supervisorName || 'Foreman'}</Text>
    //         <Text style={styles.headerSubtitle}>Date: {new Date(date + 'T00:00:00').toLocaleDateString()}</Text>
    //     </View>
    // );

    return (
        <View style={styles.container}>
            <FlatList
                data={tickets}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                // ListHeaderComponent={ListHeader}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => openModal(item)} style={styles.ticketCard} activeOpacity={0.8}>
                        {item.image_path ? (
                            <Image
                                source={{ uri: `${apiClient.defaults.baseURL}${item.image_path}` }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.image, styles.placeholder]}>
                                <Ionicons name="image-outline" size={40} color={THEME.colors.brandStone} />
                            </View>
                        )}
                        <View style={styles.phaseCodeWrapper}>
                            <Text style={styles.phaseCodeLabel}>Phase Code:</Text>
                            <Text style={[styles.phaseCodeText, !item.phase_code && styles.phaseCodeMissing]}>
                                {item.phase_code || 'MISSING'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={60} color={THEME.colors.brandStone} />
                        <Text style={styles.emptyText}>No Tickets Found</Text>
                        <Text style={styles.emptySubText}>No field tickets submitted for this date.</Text>
                    </View>
                }
            />

            {/* Modal to show full image + phase code */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                            <Ionicons name="close-circle" size={40} color={THEME.colors.danger} />
                        </TouchableOpacity>
                        
                        {selectedTicket?.image_path ? (
                            <Image
                                source={{ uri: `${apiClient.defaults.baseURL}${selectedTicket.image_path}` }}
                                style={styles.modalImage}
                                resizeMode="contain"
                            />
                        ) : (
                             <View style={[styles.modalImage, styles.placeholder, { height: width * 0.8, backgroundColor: THEME.colors.cardLight }]}>
                                <Ionicons name="image-outline" size={80} color={THEME.colors.brandStone} />
                            </View>
                        )}

                        <View style={styles.modalInfoBar}>
                            <Text style={styles.modalInfoText}>
                                Phase Code: 
                                <Text style={[styles.modalPhaseCode, !selectedTicket?.phase_code && styles.phaseCodeMissing]}>
                                    {' '}{selectedTicket?.phase_code || 'MISSING'}
                                </Text>
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: THEME.colors.backgroundLight,
    },
    listContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom: 20,
    },
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: THEME.colors.backgroundLight 
    },

    // Header
    listHeader: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
        marginBottom: 10,
    },
    headerTitle: {
        fontFamily: THEME.fontFamily.display,
        fontSize: 20,
        fontWeight: '700',
        color: THEME.colors.contentLight,
    },
    headerSubtitle: {
        fontFamily: THEME.fontFamily.display,
        fontSize: 14,
        color: THEME.colors.subtleLight,
        marginTop: 4
    },

    // Card Styles
    columnWrapper: { 
        justifyContent: 'space-between', 
        marginBottom: COLUMN_SPACING 
    },
    ticketCard: {
        width: IMAGE_SIZE,
        backgroundColor: THEME.colors.cardLight,
        borderRadius: THEME.borderRadius.sm,
        padding: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: IMAGE_SIZE * 0.9, // Make image aspect ratio slightly taller than square
        borderRadius: THEME.borderRadius.sm - 2,
        backgroundColor: THEME.colors.border,
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    phaseCodeWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 6,
        paddingVertical: 2,
    },
    phaseCodeLabel: {
        fontFamily: THEME.fontFamily.display,
        fontSize: 12,
        fontWeight: '500',
        color: THEME.colors.subtleLight,
        marginRight: 4
    },
    phaseCodeText: {
        fontFamily: THEME.fontFamily.display,
        fontSize: 14,
        fontWeight: '700',
        color: THEME.colors.primary,
        textAlign: 'center',
    },
    phaseCodeMissing: {
        color: THEME.colors.danger,
    },


    // Empty State
    emptyContainer: { 
        alignItems: 'center', 
        marginTop: 80 
    },
    emptyText: { 
        fontFamily: THEME.fontFamily.display,
        fontSize: 18, 
        fontWeight: '600',
        color: THEME.colors.subtleLight, 
        marginTop: 10 
    },
    emptySubText: {
        fontFamily: THEME.fontFamily.display,
        fontSize: 14,
        color: THEME.colors.brandStone, 
        marginTop: 5
    },

    // Modal Styles
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: { 
        width: '90%', 
        alignItems: 'center',
    },
    modalImage: { 
        width: '100%', 
        height: width * 0.8, // Take up a significant portion of the screen
        borderRadius: THEME.borderRadius.sm,
        backgroundColor: THEME.colors.contentLight, // Dark background for the image view
    },
    closeButton: { 
        position: 'absolute', 
        top: -20, 
        right: -10, 
        zIndex: 2,
        backgroundColor: THEME.colors.cardLight,
        borderRadius: THEME.borderRadius.full,
    },
    modalInfoBar: {
        marginTop: 20,
        backgroundColor: THEME.colors.primary,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: THEME.borderRadius.sm,
    },
    modalInfoText: {
        fontFamily: THEME.fontFamily.display,
        fontSize: 16,
        fontWeight: '500',
        color: THEME.colors.cardLight,
    },
    modalPhaseCode: {
        fontWeight: '700',
    }
});

export default PETicketList;