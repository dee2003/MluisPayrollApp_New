import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../api/apiClient';
import { THEME } from '../../constants/theme';

interface Ticket {
    id: number;
    image_path: string;
    phase_code_id?: number | null;
}

export default function SupervisorTicketsScreen({ route }: any) {
    const navigation = useNavigation();
    const { foremanId, foremanName, date } = route.params;

    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [phaseCodes, setPhaseCodes] = useState<Record<number, number | null>>({});
    const [savedStatus, setSavedStatus] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [availablePhases, setAvailablePhases] = useState<{ label: string; value: number }[]>([]);

    // ✅ Set screen title dynamically
    useEffect(() => {
        navigation.setOptions({
            title: `${foremanName}'s Tickets`,
        });
    }, [foremanName, navigation]);

    // ✅ Fetch available phase codes
    useEffect(() => {
        const fetchPhaseCodes = async () => {
            try {
                const res = await apiClient.get('/api/job-phases/phase-codes');
                const options = res.data.map((p: any) => ({
                    label: `${p.code} - ${p.description || ''}`,
                    value: p.id, // ✅ only ID saved
                }));
                setAvailablePhases(options);
            } catch (err) {
                console.error('Failed to load phase codes', err);
            }
        };
        fetchPhaseCodes();
    }, []);

    // ✅ Fetch supervisor tickets
    const loadTickets = useCallback(async () => {
        const fetchStateSetter = refreshing ? setRefreshing : setLoading;
        fetchStateSetter(true);
        try {
            const response = await apiClient.get('/api/tickets/for-supervisor', {
                params: { foreman_id: foremanId, date },
            });

            const data: Ticket[] = response.data || [];
            setTickets(data);

            const codes: Record<number, number | null> = {};
            data.forEach(t => {
                codes[t.id] = t.phase_code_id || null;
            });
            setPhaseCodes(codes);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to load tickets');
        } finally {
            fetchStateSetter(false);
        }
    }, [foremanId, date, refreshing]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const handleRefresh = () => {
        loadTickets();
    };

    // ✅ Save selected phase code (takes value directly)
    const savePhaseCode = async (ticketId: number, phase_code_id: number) => {
        const originalTicket = tickets.find(t => t.id === ticketId);
        if (originalTicket?.phase_code_id === phase_code_id) return; // no change

        try {
            setSavedStatus(prev => ({ ...prev, [ticketId]: false }));
            await apiClient.patch(`/api/tickets/${ticketId}`, { phase_code_id }); // ✅ backend expects this
            setTickets(prev =>
                prev.map(t =>
                    t.id === ticketId ? { ...t, phase_code_id } : t
                )
            );
            setSavedStatus(prev => ({ ...prev, [ticketId]: true }));
        } catch (err: any) {
            console.error(err);
            Alert.alert('Save Error', err.response?.data?.detail || 'Failed to save phase code');
            setSavedStatus(prev => ({ ...prev, [ticketId]: false }));
        }
    };

    // ✅ Render each ticket
    const renderTicket = ({ item }: { item: Ticket }) => (
        <View style={styles.ticketContainer}>
            <TouchableOpacity onPress={() => {}}>
                <Image
                    source={{ uri: `${apiClient.defaults.baseURL}${item.image_path}` }}
                    style={styles.image}
                />
            </TouchableOpacity>

            <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                    <RNPickerSelect
                        onValueChange={(value) => {
                            if (value == null) return;
                            setPhaseCodes(prev => ({ ...prev, [item.id]: value }));
                            setSavedStatus(prev => ({ ...prev, [item.id]: false }));
                            savePhaseCode(item.id, value); // ✅ pass value directly
                        }}
                        items={availablePhases}
                        value={phaseCodes[item.id]}
                        placeholder={{ label: 'Select Phase Code', value: null }}
                        style={{
                            inputIOS: styles.input,
                            inputAndroid: styles.input,
                        }}
                        useNativeAndroidPickerStyle={false}
                    />
                </View>

                <View
                    style={[
                        styles.statusIndicator,
                        { backgroundColor: savedStatus[item.id] ? THEME.colors.success : THEME.colors.brandStone },
                    ]}
                >
                    <Ionicons
                        name={savedStatus[item.id] ? 'checkmark' : 'sync'}
                        size={16}
                        color={THEME.colors.cardLight}
                    />
                </View>
            </View>

            {savedStatus[item.id] && (
                <Text style={styles.savedText}>Saved</Text> // ✅ optional feedback text
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={THEME.colors.brandStone} />
            </View>
        );
    }

    return (
        <FlatList
            data={tickets}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTicket}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            contentContainerStyle={styles.listContainer}
        />
    );
}

const styles = StyleSheet.create({
    listContainer: {
        padding: 10,
    },
    ticketContainer: {
        backgroundColor: THEME.colors.cardLight,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        paddingBottom: 8,
    },
    image: {
        width: '100%',
        height: 200,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: THEME.colors.subtleLight,
        borderRadius: 8,
        padding: 8,
        color: THEME.colors.textDark,
        backgroundColor: '#f9f9f9',
    },
    statusIndicator: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    savedText: {
        textAlign: 'right',
        color: THEME.colors.success,
        fontSize: 12,
        marginRight: 10,
        marginTop: -6,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
