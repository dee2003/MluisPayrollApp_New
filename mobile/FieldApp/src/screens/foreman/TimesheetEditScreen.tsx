

// import React, { useState, useEffect } from 'react';
// import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
// import { RouteProp } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import DatePicker from 'react-native-date-picker';
// import apiClient from '../../api/apiClient';
// import { Timesheet } from '../../types';
// import { ForemanStackParamList } from '../../navigation/AppNavigator';
// import { Dropdown } from 'react-native-element-dropdown';

// // --- Theme Constants ---
// const THEME = {
//   primary: '#007AFF',
//   success: '#34C759',
//   danger: '#FF3B30',
//   background: '#F0F0F7',
//   card: '#FFFFFF',
//   text: '#1C1C1E',
//   textSecondary: '#6A6A6A',
//   border: '#E0E0E5',
//   lightGray: '#F8F8F8',
//   SPACING: 16,
// };

// // --- Type Definitions ---
// type ComplexHourState = { [key: string]: { [key: string]: { REG?: string; S_B?: string } } };
// type EmployeeHourState = { [key: string]: { [key: string]: { [classCode: string]: string } } };
// type SimpleHourState = { [key: string]: { [key: string]: string } };
// type QuantityState = { [key: string]: string };
// type PhaseTotalState = { [key: string]: number };
// type UnitState = { [key: string]: string | null };
// type EditScreenRouteProp = RouteProp<ForemanStackParamList, 'TimesheetEdit'>;
// type EditScreenNavigationProp = StackNavigationProp<ForemanStackParamList, 'TimesheetEdit'>;
// type Props = { route: EditScreenRouteProp; navigation: EditScreenNavigationProp; };
// type EntityType = 'material' | 'vendor' | 'equipment' | 'dumping_site';

// // --- Unit Constants ---
// const MATERIAL_UNITS = [
//   { label: 'Hrs', value: 'Hrs' },
//   { label: 'CY', value: 'CY' },
//   { label: 'TON', value: 'TON' },
//   { label: 'SF', value: 'SF' },
//   { label: 'SY', value: 'SY' },
//   { label: 'LF', value: 'LF' },
//   { label: 'EA', value: 'EA' },
//   { label: 'Cube', value: 'cube' },
//   { label: 'Yard', value: 'yar' },
// ];

// const WORK_PERFORMED_UNITS = [
//   { label: 'CY', value: 'CY' },
//   { label: 'TON', value: 'TON' },
//   { label: 'SF', value: 'SF' },
//   { label: 'SY', value: 'SY' },
//   { label: 'LF', value: 'LF' },
//   { label: 'EA', value: 'EA' },
// ];

// const TimesheetEditScreen = ({ route, navigation }: Props) => {
//   const { timesheetId } = route.params;

//   const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
//   const [foremanName, setForemanName] = useState('');
//   const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
//   const [timesheetDate, setTimesheetDate] = useState(new Date());
//   const [isDatePickerVisible, setDatePickerVisible] = useState(false);
//   const [notes, setNotes] = useState('');
//   const [jobTitle, setJobTitle] = useState('Timesheet');

//   const [employeeHours, setEmployeeHours] = useState<EmployeeHourState>({});
//   const [equipmentHours, setEquipmentHours] = useState<ComplexHourState>({});
//   const [materialHours, setMaterialHours] = useState<SimpleHourState>({});
//   const [vendorHours, setVendorHours] = useState<SimpleHourState>({});
//   const [materialTickets, setMaterialTickets] = useState<SimpleHourState>({});
//   const [vendorTickets, setVendorTickets] = useState<SimpleHourState>({});
//   const [totalQuantities, setTotalQuantities] = useState<QuantityState>({});
//   const [materialUnits, setMaterialUnits] = useState<UnitState>({});
//   const [vendorUnits, setVendorUnits] = useState<UnitState>({});
//   const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);

//   const [loading, setLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Dumping Site State
//   const [dumpingSiteHours, setDumpingSiteHours] = useState<SimpleHourState>({});
//   const [dumpingSiteTickets, setDumpingSiteTickets] = useState<SimpleHourState>({});

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await apiClient.get(`/api/timesheets/${timesheetId}`);
//         const tsData: Timesheet = response.data;
//         setTimesheet(tsData);
//         if (tsData.date) setTimesheetDate(new Date(tsData.date));
//         setNotes(tsData.data?.notes || '');
//         const jobName = tsData.data?.job?.job_description || tsData.data?.job_name || 'Timesheet';
//         setJobTitle(jobName);
//         navigation.setOptions({ title: `${jobName} - Edit` });

//         if (tsData.data?.job?.phase_codes?.length > 0) {
//           setSelectedPhase(tsData.data.job.phase_codes[0]);
//         }

//         const populateSimple = (entities: any[] = [], field: 'hours_per_phase' | 'tickets_per_phase'): SimpleHourState => {
//           const state: SimpleHourState = {};
//           entities.forEach(e => {
//             state[e.id] = {};
//             if (e[field]) {
//               for (const phase in e[field]) {
//                 state[e.id][phase] = e[field][phase]?.toString() || '';
//               }
//             }
//           });
//           return state;
//         };

//         const populateEmployees = (entities: any[] = []): EmployeeHourState => {
//           const state: EmployeeHourState = {};
//           entities.forEach(e => {
//             state[e.id] = {};
//             if (e.hours_per_phase) {
//               for (const phase in e.hours_per_phase) {
//                 state[e.id][phase] = {};
//                 const v = e.hours_per_phase[phase];
//                 if (v && typeof v === 'object') {
//                   for (const classCode in v) {
//                     state[e.id][phase][classCode] = (v[classCode] ?? '').toString();
//                   }
//                 }
//               }
//             }
//           });
//           return state;
//         };

//         const populateEquipmentComplex = (entities: any[] = []): ComplexHourState => {
//           const state: ComplexHourState = {};
//           entities.forEach(e => {
//             state[e.id] = {};
//             if (e.hours_per_phase) {
//               for (const phase in e.hours_per_phase) {
//                 const v = e.hours_per_phase[phase];
//                 if (v && typeof v === 'object') {
//                   state[e.id][phase] = { REG: (v.REG ?? '').toString(), S_B: (v.S_B ?? '').toString() };
//                 } else {
//                   const num = parseFloat(v ?? 0);
//                   state[e.id][phase] = { REG: !isNaN(num) ? num.toString() : '', S_B: '' };
//                 }
//               }
//             }
//           });
//           return state;
//         };

//         const populateUnits = (entities: any[] = []): UnitState => {
//           const state: UnitState = {};
//           entities.forEach(e => {
//             state[e.id] = e.unit || null;
//           });
//           return state;
//         };

//         setEmployeeHours(populateEmployees(tsData.data?.employees || []));
//         setEquipmentHours(populateEquipmentComplex(tsData.data?.equipment || []));
//         setMaterialHours(populateSimple(tsData.data?.materials || [], 'hours_per_phase'));
//         setVendorHours(populateSimple(tsData.data?.vendors || [], 'hours_per_phase'));
//         setDumpingSiteHours(populateSimple(tsData.data?.dumping_sites || [], 'hours_per_phase'));
//         setMaterialTickets(populateSimple(tsData.data?.materials || [], 'tickets_per_phase'));
//         setVendorTickets(populateSimple(tsData.data?.vendors || [], 'tickets_per_phase'));
//         setDumpingSiteTickets(populateSimple(tsData.data?.dumping_sites || [], 'tickets_per_phase'));
//         setMaterialUnits(populateUnits(tsData.data?.materials || []));
//         setVendorUnits(populateUnits(tsData.data?.vendors || []));

//         if (tsData.data?.total_quantities_per_phase) {
//           const q: QuantityState = {};
//           for (const phase in tsData.data.total_quantities_per_phase) {
//             q[phase] = String(tsData.data.total_quantities_per_phase[phase]);
//           }
//           setTotalQuantities(q);
//         }

//         const eqRes = await apiClient.get('/api/equipment');
//         setAvailableEquipment(eqRes.data || []);
//         const res = await apiClient.get(`/api/users/${tsData.foreman_id}`);
//         const fn = `${res.data?.first_name || ''} ${res.data?.middle_name || ''} ${res.data?.last_name || ''}`.replace(/\s+/g, ' ').trim();
//         setForemanName(fn);
//       } catch (err) {
//         console.error(err);
//         Alert.alert('Error', 'Failed to load timesheet data.');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [timesheetId, navigation]);

//   const handleEmployeeHourChange = (employeeId: string, phaseCode: string, classCode: string, value: string) => {
//     const sanitized = value.replace(/[^0-9.]/g, '');
//     setEmployeeHours(prev => ({
//       ...prev,
//       [employeeId]: {
//         ...prev[employeeId],
//         [phaseCode]: {
//           ...prev[employeeId]?.[phaseCode],
//           [classCode]: sanitized,
//         },
//       },
//     }));
//   };

//   const handleComplexHourChange = (
//     setter: React.Dispatch<React.SetStateAction<ComplexHourState>>,
//     entityId: string,
//     phaseCode: string,
//     hourType: 'REG' | 'S_B',
//     value: string
//   ) => {
//     const sanitized = value.replace(/[^0-9.]/g, '');
//     setter(prev => ({
//       ...prev,
//       [entityId]: {
//         ...prev[entityId],
//         [phaseCode]: { ...prev[entityId]?.[phaseCode], [hourType]: sanitized },
//       },
//     }));
//   };

//   const handleSimpleValueChange = (
//     entityType: 'material' | 'vendor' | 'dumping_site',
//     field: 'hours' | 'tickets',
//     entityId: string,
//     phaseCode: string,
//     value: string
//   ) => {
//     const sanitize = (val: string): string => val.replace(/[^0-9.]/g, '');
//     const sanitized = sanitize(value);

//     const setters = {
//       material: { hours: setMaterialHours, tickets: setMaterialTickets },
//       vendor: { hours: setVendorHours, tickets: setVendorTickets },
//       dumping_site: { hours: setDumpingSiteHours, tickets: setDumpingSiteTickets },
//     };

//     const setter = setters[entityType][field];
//     setter((prev) => ({
//       ...prev,
//       [entityId]: { ...(prev[entityId] || {}), [phaseCode]: sanitized },
//     }));
//   };
  
//   const handleUnitChange = (
//     type: 'material' | 'vendor',
//     entityId: string,
//     unit: string
//   ) => {
//     const setter = type === 'material' ? setMaterialUnits : setVendorUnits;
//     setter(prev => ({ ...prev, [entityId]: unit }));
//   };

//   const handleTotalQuantityChange = (phaseCode: string, value: string) => {
//     const sanitized = value.replace(/[^0-g.]/g, '');
//     setTotalQuantities(prev => ({ ...prev, [phaseCode]: sanitized }));
//   };

//   const handleRemoveEquipment = (id: string) => {
//     setTimesheet(ts => {
//       if (!ts) return ts;
//       return { ...ts, data: { ...ts.data, equipment: (ts.data.equipment || []).filter(eq => eq.id !== id) } };
//     });
//     setEquipmentHours(prev => {
//       const copy = { ...prev };
//       delete copy[id];
//       return copy;
//     });
//   };

//   const handleAddEquipment = (item: any) => {
//     if (!item || !item.value || !timesheet) return;
//     const equipmentToAdd = availableEquipment.find(eq => eq.id === item.value);
//     if (!equipmentToAdd) return;
//     if ((timesheet.data.equipment || []).some((e: any) => e.id === equipmentToAdd.id)) {
//       Alert.alert('Duplicate', 'This equipment has already been added.');
//       return;
//     }
//     setTimesheet(ts => {
//       if (!ts) return ts;
//       return { ...ts, data: { ...ts.data, equipment: [...(ts.data.equipment || []), equipmentToAdd] } };
//     });
//     setEquipmentHours(prev => ({ ...prev, [equipmentToAdd.id]: {} }));
//   };

// const handleSave = async () => {
//   if (!timesheet) return;
//   setIsSubmitting(true);

//   try {
//     // Convert object of string values to numbers
//     const toNumbersSimple = (m: Record<string, string>): Record<string, number> => {
//       const out: Record<string, number> = {};
//       Object.keys(m || {}).forEach(phase => {
//         const num = parseFloat(m[phase] || '0');
//         out[phase] = !isNaN(num) ? num : 0;
//       });
//       return out;
//     };

//     // Process employees' hours
//     const processEmployees = (
//       empId: string,
//       phaseHours: { [phase: string]: { [classCode: string]: string } }
//     ): Record<string, Record<string, number>> => {
//       const out: Record<string, Record<string, number>> = {};
//       Object.keys(phaseHours || {}).forEach(phase => {
//         out[phase] = {};
//         const classEntries = phaseHours[phase];
//         Object.keys(classEntries || {}).forEach(classCode => {
//           const num = parseFloat(classEntries[classCode] || '0');
//           if (!isNaN(num) && num > 0) {
//             out[phase][classCode] = num;
//           }
//         });
//       });
//       return out;
//     };

//     // Process equipment hours
//     const processEquipment = (
//       m: { [key: string]: { REG?: string; SB?: string } }
//     ): Record<string, { REG: number; SB: number }> => {
//       const out: Record<string, { REG: number; SB: number }> = {};
//       Object.keys(m || {}).forEach(phase => {
//         const reg = parseFloat(m[phase]?.REG || '0');
//         const sb = parseFloat(m[phase]?.SB || '0');
//         out[phase] = {
//           REG: isNaN(reg) ? 0 : reg,
//           SB: isNaN(sb) ? 0 : sb,
//         };
//       });
//       return out;
//     };

//     // Map and update all entity data
//     const updatedEmployees = timesheet.data.employees?.map(emp => ({
//       ...emp,
//       hours_per_phase: processEmployees(emp.id, employeeHours[emp.id]),
//     }));

//     const updatedEquipment = timesheet.data.equipment?.map(eq => ({
//       ...eq,
//       hours_per_phase: processEquipment(equipmentHours[eq.id]),
//     }));

//     const updatedMaterials = timesheet.data.materials?.map(mat => ({
//       ...mat,
//       unit: materialUnits[mat.id],
//       hours_per_phase: toNumbersSimple(materialHours[mat.id] || {}),
//       tickets_per_phase: toNumbersSimple(materialTickets[mat.id] || {}),
//     }));

//     const updatedVendors = timesheet.data.vendors?.map(ven => ({
//       ...ven,
//       unit: vendorUnits[ven.id],
//       hours_per_phase: toNumbersSimple(vendorHours[ven.id] || {}),
//       tickets_per_phase: toNumbersSimple(vendorTickets[ven.id] || {}),
//     }));

//     const updatedDumpingSites = timesheet.data.dumping_sites?.map(site => ({
//       ...site,
//       hours_per_phase: toNumbersSimple(dumpingSiteHours[site.id] || {}),
//       tickets_per_phase: toNumbersSimple(dumpingSiteTickets[site.id] || {}),
//     }));

//     // Build final data payload
//     const updatedData = {
//       ...timesheet.data,
//       employees: updatedEmployees,
//       equipment: updatedEquipment,
//       materials: updatedMaterials,
//       vendors: updatedVendors,
//       dumping_sites: updatedDumpingSites,
//       total_quantities_per_phase: toNumbersSimple(totalQuantities),
//       notes,
//     };

//     // Construct backend payload
//     const payload = {
//       data: updatedData,
//       status: 'Pending', // use 'draft' to match backend creation logic
//     };

//     console.log('Saving payload:', JSON.stringify(payload, null, 2));

//     // Send update request
//     await apiClient.put(`/api/timesheets/${timesheet.id}`, payload);

//     Alert.alert('Success', 'Timesheet draft saved successfully!');
//     navigation.goBack();

//   } catch (e) {
//     // ✅ Proper error handling for TypeScript
//     if (e instanceof Error) {
//       console.error('Save failed:', e.message);
//     } else if ((e as any)?.response?.data) {
//       console.error('Save failed:', (e as any).response.data);
//     } else {
//       console.error('Save failed:', e);
//     }

//     Alert.alert('Error', 'Failed to save timesheet. Please try again.');
//   } finally {
//     setIsSubmitting(false);
//   }
// };


//   const calculateTotalEmployeeHours = (state: EmployeeHourState, entityId: string): number => {
//       const entityPhases = state[entityId];
//       if (!entityPhases) return 0;
//       return Object.values(entityPhases).reduce((phaseTotal, classHours) => {
//         const totalForPhase = Object.values(classHours).reduce((classTotal, hours) => {
//           const val = parseFloat(hours || '0');
//           return classTotal + (isNaN(val) ? 0 : val);
//         }, 0);
//         return phaseTotal + totalForPhase;
//       }, 0);
//     };

//     const calculateEmployeePhaseTotals = (state: EmployeeHourState, phaseCodes: string[] = []): PhaseTotalState => {
//       const totals: PhaseTotalState = {};
//       phaseCodes.forEach(p => { totals[p] = 0; });

//       Object.values(state).forEach(perEntity => {
//         phaseCodes.forEach(p => {
//           if (perEntity[p]) {
//             Object.values(perEntity[p]).forEach(hoursStr => {
//               const val = parseFloat(hoursStr || '0');
//               if (!isNaN(val)) {
//                 totals[p] += val;
//               }
//             });
//           }
//         });
//       });
//       return totals;
//     };

//     const calculateTotalComplexHours = (hoursState: ComplexHourState, entityId: string): number => {
//       const m = hoursState[entityId];
//       if (!m) return 0;
//       return Object.values(m).reduce((t, v) => {
//         const reg = parseFloat(v?.REG || '0');
//         const sb = parseFloat(v?.S_B || '0');
//         return t + (isNaN(reg) ? 0 : reg) + (isNaN(sb) ? 0 : sb);
//       }, 0);
//     };

//     const calculateComplexPhaseTotals = (hoursState: ComplexHourState, phaseCodes: string[] = []): PhaseTotalState => {
//       const totals: PhaseTotalState = {};
//       phaseCodes.forEach(p => { totals[p] = 0; });
//       Object.values(hoursState).forEach(perEntity => {
//         phaseCodes.forEach(p => {
//           const reg = parseFloat(perEntity[p]?.REG || '0');
//           const sb = parseFloat(perEntity[p]?.S_B || '0');
//           if (!isNaN(reg)) totals[p] += reg;
//           if (!isNaN(sb)) totals[p] += sb;
//         });
//       });
//       return totals;
//     };

//     const calculateTotalSimple = (state: SimpleHourState, entityId: string): number => {
//       const m = state[entityId];
//       if (!m) return 0;
//       return Object.values(m).reduce((t, v) => t + parseFloat(v || '0'), 0);
//     };

//     const calculateSimplePhaseTotals = (state: SimpleHourState, phaseCodes: string[] = []): PhaseTotalState => {
//       const totals: PhaseTotalState = {};
//       phaseCodes.forEach(p => { totals[p] = 0; });
//       Object.values(state).forEach(perEntity => {
//         phaseCodes.forEach(p => {
//           const val = parseFloat(perEntity[p] || '0');
//           if (!isNaN(val)) totals[p] += val;
//         });
//       });
//       return totals;
//     };

//    const renderEmployeeInputs = () => {
//       const phaseCodes = timesheet?.data?.job?.phase_codes || [];
//       const phaseTotals = calculateEmployeePhaseTotals(employeeHours, phaseCodes);
//       const employees = timesheet?.data?.employees || [];

//       return (
//         <View style={styles.card}>
//           <Text style={styles.cardTitle}>Employees</Text>
//           {employees.map((entity, index) => {
//             const total = calculateTotalEmployeeHours(employeeHours, entity.id);
//             const name = `${entity.first_name || ''} ${entity.middle_name || ''} ${entity.last_name || ''}`.replace(/\s+/g, ' ').trim();
//             const isLast = index === employees.length - 1;
//             const classCodes = [entity.class_1, entity.class_2].filter(Boolean);
//             const classCodeString = classCodes.join(' / '); 

//             return (
//               <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
//                 <View style={styles.entityHeader}>
//                   <Text style={styles.employeeName}>{name}</Text>
//                   <Text style={styles.employeeId}>EMP ID: {entity.id}</Text>
//                 </View>
//                 
//                 <View style={styles.controlsRow}>
//                   <View style={styles.hoursContainer}>
                    
//                     <View style={styles.inputWithLabel}>
//                         <Text style={styles.inputHeader}>Class Codes</Text>
//                         <Text style={styles.classCodeSummary}>{classCodeString}</Text>
//                     </View>

//                     {classCodes.map((cc) => (
//                       <View style={styles.inputWithLabel} key={cc}>
//                           <Text style={styles.inputHeader}>Hours</Text>
                          
//                     <TextInput
//                         style={styles.input}
//                           keyboardType="numeric"
//                           placeholder="0"
//                           value={employeeHours[entity.id]?.[selectedPhase ?? '']?.[cc as string] ?? ''}
//                           onChangeText={text => selectedPhase && handleEmployeeHourChange(entity.id, selectedPhase, cc as string, text)}
//                         />
//                         <Text style={styles.employeeClassCodeFooter}>{cc as string}</Text>  
//                       </View>
//                     ))}
                    
//                     <View style={styles.inputWithLabel}>
//                       <Text style={styles.inputHeader}>Total</Text>
//                       <View style={styles.totalBox}>
//                         <Text style={styles.totalText}>{total.toFixed(1)}</Text>
//                       </View>
//                     </View>
//     _C             </View>
//                 </View>
                
//               </View>
//             );
//           })}
//           <View style={styles.totalsRow}>

//             <Text style={styles.totalsLabel}>Total Hours</Text>
//             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsContainer}>
//               {timesheet?.data.job.phase_codes?.map((phase: string) => (
//                 <View key={phase} style={styles.totalPhaseItem}>
//                   <Text style={styles.totalPhaseHeader}>{phase}</Text>
//                   <View style={styles.totalBox}>
//                     <Text style={styles.totalText}>{phaseTotals[phase]?.toFixed(1) ?? '0.0'}</Text>
//                   </View>
//                 </View>
//               ))}
//             </ScrollView>
//           </View>
//         </View>
//       );
//     };

//   const renderEntityInputs = (
//       title: string,
//       entities: any[] = [],
//       type: 'equipment' | 'material' | 'vendor' | 'dumping_site'

//     ) => {
//       if ((entities.length === 0) && type !== 'equipment') return null;

//       const isEquipment = type === 'equipment';
//       const isMaterial = type === 'material';
//       const isVendor = type === 'vendor';
//       const isDumpingSite = type === 'dumping_site';

//       const hoursState = isEquipment
//         ? equipmentHours
//         : isMaterial
//         ? materialHours
//         : isDumpingSite
//         ? dumpingSiteHours
//         : vendorHours;

//       const ticketsState = isMaterial
//         ? materialTickets
//         : isDumpingSite
//         ? dumpingSiteTickets
//         : vendorTickets;

//       const phaseHourTotals = isEquipment
//         ? calculateComplexPhaseTotals(hoursState as ComplexHourState, timesheet?.data.job.phase_codes || [])
//         : calculateSimplePhaseTotals(hoursState as SimpleHourState, timesheet?.data.job.phase_codes || []);

//       const getHeader = (fieldType: 'hours' | 'tickets') => {
//         if (isMaterial) {
//           return fieldType === 'hours' ? 'Hrs / Qty' : '# of Tickets';
//         }
//         if (isVendor) {
//           return fieldType === 'hours' ? 'Qty' : '# of Tickets';
//         }
//         if (isDumpingSite) {
//             return fieldType === 'hours' ? '# of Loads' : 'Qty';
//         }
//         return 'Hours';
//       };

//       const calculateLabor = (matId: string, phase: string) => {
//           const totalHours = parseFloat(materialHours[matId]?.[phase] || '0');
//           const totalQty = parseFloat(materialTickets[matId]?.[phase] || '0');
//           if (totalQty > 0) {
//               return (totalHours / totalQty).toFixed(2);
//           }
//           return '0.00';
//       };

//       // ... existing code ...

//       if (isDumpingSite) {
//         return (
//           <View style={styles.card}>
//             <Text style={styles.cardTitle}>{title}</Text>
//             {entities.map((entity) => (
//               <View key={entity.id} style={styles.entityContainer}>
//                 <Text style={styles.inputLabel}>{entity.name}</Text>
//                 <View style={styles.controlsRow}>
//                  {/* START: Added a new container View to group inputs */}
//                   <View style={styles.hoursContainer}> 
//                     <View style={[styles.inputWithLabel, { marginLeft: 0 }]}> {/* Adjusted marginLeft */}
//                       <Text style={styles.inputHeader}># of Loads</Text>
//                       <TextInput
//                         style={styles.input}
//                         keyboardType="numeric"
//                         placeholder="0"
//                         value={dumpingSiteHours[entity.id]?.[selectedPhase ?? ''] ?? ''}
//                         onChangeText={(text) =>
//                           selectedPhase &&
//                           handleSimpleValueChange('dumping_site', 'hours', entity.id, selectedPhase, text)
//                         }
//                       />
//                     </View>
//                     <View style={styles.inputWithLabel}>
//                       <Text style={styles.inputHeader}>Qty</Text>
//                       <TextInput
//                         style={styles.input}
//                         keyboardType="numeric"
//                         placeholder="0"
//                         value={dumpingSiteTickets[entity.id]?.[selectedPhase ?? ''] ?? ''}
//                         onChangeText={(text) =>
//                           selectedPhase &&
//                           handleSimpleValueChange('dumping_site', 'tickets', entity.id, selectedPhase, text)
//                         }
//                       />
//                     </View>
//                   </View> {/* END: New container View */}
//                   <View style={styles.inputWithLabel}>
//                     <Text style={styles.inputHeader}>Total</Text>
//                     <View style={styles.totalBox}>
//                       <Text style={styles.totalText}>
//                         {(
//                           Object.values(dumpingSiteTickets[entity.id] || {})
//                             .reduce((sum, val) => sum + parseFloat(val || '0'), 0)
//                             .toFixed(1)
//                         )}
//                       </Text>
//                     </View>
//                   </View>
//                 </View>
//               </View>
//             ))}
//           </View>
//         );
//       }

// // ... existing code ...
      
//       return (
//         <View style={styles.card}>
//           <Text style={styles.cardTitle}>{title}</Text>
//           {entities.map((entity, index) => {
//             const totalHours = isEquipment
//               ? calculateTotalComplexHours(hoursState as ComplexHourState, entity.id)
//               : calculateTotalSimple(hoursState as SimpleHourState, entity.id);
//             const name = isEquipment ? `${entity.id} - ${entity.name}` : entity.name;
//             const isLast = index === entities.length - 1 && !isEquipment;

//             return (
//               <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
//                 {isEquipment ? (
//                       <View style={styles.entityHeader}>
//                         <Text style={styles.employeeName}>{entity.name}</Text>
//                         <Text style={styles.employeeId}>EQP ID: {entity.id}</Text>
//                       </View>
//                     ) : (
//                       <Text style={styles.inputLabel}>{name}</Text>
//                     )}
                
//                 <View style={styles.controlsRow}>
//                   <View style={{ flex: 1 }}>
//                     <View style={styles.entityInputRow}>
//                     <View style={styles.hoursContainer}>
//                       </View>
//                       {isEquipment ? (
//                         <>
//                           <View style={styles.inputWithLabel}>
//                             <Text style={styles.inputHeader}>REG</Text>
//                             <TextInput
//                               style={styles.input} keyboardType="numeric" placeholder="0"
//                               value={equipmentHours[entity.id]?.[selectedPhase ?? '']?.REG ?? ''}
//                               onChangeText={text => selectedPhase && handleComplexHourChange(setEquipmentHours, entity.id, selectedPhase, 'REG', text)}
//                             />
//                           </View>
//                           <View style={styles.inputWithLabel}>
//                             <Text style={styles.inputHeader}>S.B</Text>
//                             <TextInput
//                               style={styles.input} keyboardType="numeric" placeholder="0"
//                               value={equipmentHours[entity.id]?.[selectedPhase ?? '']?.S_B ?? ''}
//                               onChangeText={text => selectedPhase && handleComplexHourChange(setEquipmentHours, entity.id, selectedPhase, 'S_B', text)}
//                             />
//                           </View>
//                         </>
//                       ) : (
//                         <>
//                          <View style={styles.inputWithLabel}>
//                                 <Text style={styles.inputHeader}>{getHeader('tickets')}</Text>
//                                 <TextInput
//                                   style={styles.input} keyboardType="number-pad" placeholder="0"
//                                   value={(ticketsState as SimpleHourState)[entity.id]?.[selectedPhase ?? ''] ?? ''}
//                                   onChangeText={text => selectedPhase && handleSimpleValueChange(type, 'tickets', entity.id, selectedPhase, text)}
//                                 />
//                               </View>
//                              <View style={styles.inputWithLabel}>
//                                 <Text style={styles.inputHeader}>{getHeader('hours')}</Text>
//                                 <TextInput
//                                   style={styles.input} keyboardType="numeric" placeholder="0"
//                                   value={(hoursState as SimpleHourState)[entity.id]?.[selectedPhase ?? ''] ?? ''}
//                                   onChangeText={text => selectedPhase && handleSimpleValueChange(type, 'hours', entity.id, selectedPhase, text)}
//                                 />
//                               </View>
//                          {(isMaterial || isVendor) && (
//                                 <View style={styles.inputWithLabel}>
//                                   <Text style={styles.inputHeader}>Unit</Text> 
//                                   <Dropdown
//                                     style={[styles.dropdown, styles.unitDropdown, { width: 80 }]}
//                                     data={isMaterial ? MATERIAL_UNITS : WORK_PERFORMED_UNITS}
//                                     labelField="label"
//                                     valueField="value"
//                                     placeholder="C" 
//                                     value={isMaterial ? (materialUnits[entity.id] ?? null) : (vendorUnits[entity.id] ?? null)}
//                                     onChange={item => handleUnitChange(type, entity.id, item.value)}
//                                     maxHeight={200}
//                                   />
//                                 </View>
//                               )}
//                         </>
//                           )}
//                       <View style={styles.inputWithLabel}>
//                             <Text style={styles.inputHeader}>Total</Text>
//                             <View style={styles.totalBox}><Text style={styles.totalText}>{totalHours.toFixed(1)}</Text></View>
//                           </View>
//                         </View>
//                     {/* {isMaterial && selectedPhase && (
//                       <View style={styles.laborRateContainer}>
//                         <Text style={styles.laborRateLabel}>Labor Rate (Hrs/Qty): </Text>
//                         <Text style={styles.laborRateValue}>{calculateLabor(entity.id, selectedPhase)}</Text>
//                       </View>
//                     )} */}
//                   </View>
//                   {isEquipment ? (
//                     <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveEquipment(entity.id)}>
//                       <Text style={styles.removeButtonText}>X</Text>
//                     </TouchableOpacity>
//                   ) : <View style={{ width: 44, marginLeft: 10 }} />}
//                 </View>
//               </View>
//             );
//           })}
//           <View style={styles.totalsRow}>
//             <Text style={styles.totalsLabel}>
//           {isMaterial 
//               ? 'Truck Hrs/Mat Qty\n(Phase)' 
//               : isVendor 
//                   ? 'Total Qty\n(Phase)' 
//                   : 'Total Hours'}
//       </Text>
//             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsContainer}>
//               {timesheet?.data.job.phase_codes?.map((phase: string) => (
//                 <View key={`${phase}-h`} style={styles.totalPhaseItem}>
//                   <Text style={styles.totalPhaseHeader}>{phase}</Text>
//                   <View style={styles.totalBox}>
//                     <Text style={styles.totalText}>{phaseHourTotals[phase]?.toFixed(1) ?? '0.0'}</Text>
//                   </View>
//                 </View>
//               ))}
//             </ScrollView>
//           </View>
//           {isEquipment && (
//             <View style={styles.addEquipmentRow}>
//               <Dropdown
//                 style={[styles.dropdown, { flex: 1 }]}
//                 data={availableEquipment
//                   .filter(eq => !(timesheet?.data.equipment || []).some((e: any) => e.id === eq.id))
//                   .map(eq => ({ label: `${eq.id} - ${eq.name}`, value: eq.id }))
//                 }
//                 labelField="label" valueField="value" placeholder="Select equipment to add"
//                 value={null} onChange={handleAddEquipment} maxHeight={200} search searchPlaceholder="Search..."
//               />
//             </View>
//           )}
          
//         </View>
//       );
//     };

//   if (loading) {
//     return <ActivityIndicator size="large" style={styles.centered} />;
//   }
//   if (!timesheet) {
//     return <View style={styles.centered}><Text>Timesheet not found</Text></View>;
//   }

//   const { data } = timesheet;
//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <ScrollView
//         style={{ flex: 1 }}
//         contentContainerStyle={{ padding: THEME.SPACING, paddingBottom: 100 }}
//         keyboardShouldPersistTaps="handled"
//       >
//         <View style={styles.infoCard}>
//           <Text style={styles.jobTitle}>{data.job_name}</Text>
//           <Text style={styles.jobCode}>Job Code: {data.job?.job_code ?? 'N/A'}</Text>
//           <View style={styles.infoGrid}>
//             <View style={styles.infoItem}>
//               <Text style={styles.infoLabel}>Date</Text>
//               <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
//                 <Text style={styles.infoValueClickable}>{timesheetDate.toLocaleDateString()}</Text>
//               </TouchableOpacity>
//             </View>
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Foreman</Text><Text style={styles.infoValue}>{foremanName}</Text></View>
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Project Engineer</Text><Text style={styles.infoValue}>{data.project_engineer || 'N/A'}</Text></View>
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Day</Text><Text style={styles.infoValue}>{data.time_of_day || 'N/A'}</Text></View>
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>{data.location || 'N/A'}</Text></View>
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Weather</Text><Text style={styles.infoValue}>{data.weather || 'N/A'}</Text></View>
//             <View style={styles.infoItem}><Text style={styles.infoLabel}>Temperature</Text><Text style={styles.infoValue}>{data.temperature || 'N/A'}</Text></View>
//           </View>
//         </View>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseSelectorContainer}>
//           {data.job?.phase_codes?.map((phase: string) => (
//             <TouchableOpacity
//               key={phase}
//               style={[styles.phaseButton, selectedPhase === phase && styles.selectedPhaseButton]}
//               onPress={() => setSelectedPhase(phase)}
//             >
//               <Text style={[styles.phaseButtonText, selectedPhase === phase && styles.selectedPhaseButtonText]}>{phase}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {selectedPhase && (
//           <View>
//             {renderEmployeeInputs()}
//             {renderEntityInputs('Equipment', data.equipment || [], 'equipment')}
//             {renderEntityInputs('Materials and Trucking', data.materials || [], 'material')}
//             {renderEntityInputs('Work Performed', data.vendors || [], 'vendor')}
//             {renderEntityInputs("Dumping Sites", data.dumping_sites, 'dumping_site')}
//             <View style={styles.card}>
//               <Text style={styles.cardTitle}>Total Quantity</Text>
//               <View style={styles.quantityRow}>
//                 <Text style={styles.quantityLabel}>Phase: {selectedPhase}</Text>
//                 <TextInput
//                   style={[styles.input, styles.quantityInput]}
//                   keyboardType="numeric" placeholder="Enter quantity"
//                   value={totalQuantities[selectedPhase] ?? ''}
//                   onChangeText={text => handleTotalQuantityChange(selectedPhase, text)}
//                 />
//               </View>
//             </View>
//           </View>
//         )}

//         <View style={styles.card}>
//           <Text style={styles.cardTitle}>Notes</Text>
//           <TextInput
//             style={styles.notesInput} multiline maxLength={300}
//             placeholder="Enter any notes for this timesheet..."
//             value={notes} onChangeText={setNotes}
//           />
//           <Text style={styles.characterCount}>{notes.length} / 300</Text>
//         </View>
//       </ScrollView>

//       <DatePicker modal open={isDatePickerVisible} date={timesheetDate} mode="date"
//           onConfirm={d => { 
//               setDatePickerVisible(false); 
//               setTimesheetDate(d); 
              
//               const newDateString = d.toISOString().split('T')[0];

//               setTimesheet(prev => {
//                   if (prev === null) {
//                       return null;
//                   }
                  
//                   return {
//                       ...prev,
//                       date: newDateString,
//                       data: {
//                           ...prev.data,
//                           date: newDateString, 
//                       }
//                   };
//               });
//           }}
//           onCancel={() => { setDatePickerVisible(false); }}
//       />
//       <View style={styles.footer}>
//         <TouchableOpacity
//           style={[styles.submitButton, { backgroundColor: isSubmitting ? THEME.textSecondary : THEME.primary }]}
//           onPress={handleSave}
//           disabled={isSubmitting}
//         >
//           {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Save Draft</Text>}
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };
// const styles = StyleSheet.create({
//   classCodeSummary: {
//         fontSize: 14,
//         fontWeight: '600',
//         paddingVertical: 5,
//         height: 40,
//         textAlignVertical: 'center',
//     },
    
//     employeeClassCodeFooter: {
//         fontSize: 10,
//         color: '#333',
//         textAlign: 'center',
//         marginTop: 4, 
//         marginBottom: 0,
//     },
//   safeArea: { flex: 1, backgroundColor: THEME.background },
//   centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
//   infoCard: { padding: THEME.SPACING, backgroundColor: THEME.card, borderRadius: 14, marginBottom: THEME.SPACING, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3, },
//   jobTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
//   jobCode: { fontSize: 16, color: THEME.textSecondary, marginTop: 4 },
//   infoGrid: { marginTop: THEME.SPACING, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
//   infoItem: { width: '48%', marginBottom: 8 },
//   infoLabel: { fontSize: 14, color: THEME.textSecondary, marginBottom: 2 },
//   infoValue: { fontSize: 16, fontWeight: '500', color: THEME.text },
//   infoValueClickable: { fontSize: 16, fontWeight: '500', color: THEME.primary },
//   phaseSelectorContainer: { marginVertical: THEME.SPACING / 2 },
//   phaseButton: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 10, borderRadius: 20, backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border, },
//   selectedPhaseButton: { backgroundColor: THEME.primary, borderColor: THEME.primary, shadowColor: THEME.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6, },
//   phaseButtonText: { color: THEME.text, fontWeight: '600', fontSize: 16 },
//   selectedPhaseButtonText: { color: '#FFF' },
//   card: { backgroundColor: THEME.card, borderRadius: 14, padding: THEME.SPACING, marginBottom: THEME.SPACING, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, },
//   cardTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.text, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: THEME.border, },
//   entityContainer: { paddingVertical: THEME.SPACING, borderBottomWidth: 1, borderBottomColor: THEME.border },
//   lastEntityContainer: { borderBottomWidth: 0, paddingBottom: 0 },
//   entityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
//   employeeName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     flexShrink: 1,
//     marginRight: 10,
// },
//   employeeId: {
//     fontSize: 14,
//     color: '#666',
//     flexShrink: 0,
//     marginLeft: 'auto',
//     fontWeight: 'bold'
// },
//   inputLabel: { fontSize: 18, color: THEME.text, marginBottom: 12, fontWeight: '600' },
//   controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   hoursContainer: { 
//     flexDirection: 'row', 
//     alignItems: 'flex-start',
//     justifyContent: 'flex-start', 
//     flex: 1, 
//     flexWrap: 'wrap' 
// },
// entityInputRow: {
//         flexDirection: 'row',
//         alignItems: 'flex-end', 
//     },
//   inputWithLabel: { alignItems: 'center', marginLeft: 10 },
//   inputHeader: { fontSize: 13, color: THEME.textSecondary, marginBottom: 4, fontWeight: '500' },
//   input: { borderWidth: 1.5, borderColor: THEME.border, borderRadius: 10, paddingHorizontal: 10, height: 48, width: 65, textAlign: 'center', fontSize: 16, fontWeight: '500', color: THEME.text, backgroundColor: THEME.lightGray, },
//   totalBox: { backgroundColor: THEME.background, borderRadius: 10, height: 48, width: 70, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: THEME.border, },
//   totalText: { fontSize: 16, fontWeight: 'bold', color: THEME.text },
//   dropdown: { height: 48, borderColor: THEME.border, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, backgroundColor: THEME.lightGray, },
//   unitDropdown: { width: 180, marginLeft: 10 },
//   removeButton: { marginLeft: 10, width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: `${THEME.danger}1A`, },
//   removeButtonText: { color: THEME.danger, fontWeight: 'bold', fontSize: 20, },
//   addEquipmentRow: { marginTop: THEME.SPACING, borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: THEME.SPACING },
//   quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
//   quantityLabel: { fontSize: 16, fontWeight: '500', color: THEME.text },
//   quantityInput: { width: 150 },
//   totalsRow: { flexDirection: 'row', alignItems: 'center', marginTop: THEME.SPACING, paddingTop: THEME.SPACING, borderTopWidth: 1, borderTopColor: THEME.border, },
//   totalsLabel: { fontSize: 16, fontWeight: 'bold', color: THEME.text, marginRight: 10 },
//   totalsContainer: { flexDirection: 'row' },
//   totalPhaseItem: { alignItems: 'center', marginHorizontal: 4 },
//   totalPhaseHeader: { fontSize: 12, color: THEME.textSecondary, marginBottom: 4 },
//   footer: { padding: THEME.SPACING, backgroundColor: THEME.card, borderTopWidth: 1, borderTopColor: THEME.border, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 5, },
//   submitButton: { padding: THEME.SPACING, borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 56, },
//   submitButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
//   notesInput: { borderWidth: 1.5, borderColor: THEME.border, borderRadius: 10, padding: 12, height: 100, textAlignVertical: 'top', fontSize: 16, color: THEME.text, backgroundColor: THEME.lightGray, },
//   characterCount: { fontSize: 12, color: THEME.textSecondary, textAlign: 'right', marginTop: 4 },
//   laborRateContainer: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
//   laborRateLabel: { fontSize: 14, color: THEME.textSecondary },
//   laborRateValue: { fontSize: 14, fontWeight: 'bold', color: THEME.text },
// });

// export default TimesheetEditScreen;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DatePicker from 'react-native-date-picker';
import apiClient from '../../api/apiClient';
import { Timesheet } from '../../types';
import { ForemanStackParamList } from '../../navigation/AppNavigator';
import { Dropdown } from 'react-native-element-dropdown';

// --- Theme Constants ---
const THEME = {
  primary: '#007AFF',
  success: '#34C759',
  danger: '#FF3B30',
  background: '#F0F0F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#6A6A6A',
  border: '#E0E0E5',
  lightGray: '#F8F8F8',
  SPACING: 16,
};

// --- Type Definitions ---
type ComplexHourState = { [key: string]: { [key: string]: { REG?: string; SB?: string } } };
type EmployeeHourState = { [key: string]: { [key: string]: { [classCode: string]: string } } };
type SimpleHourState = { [key: string]: { [key: string]: string } };
type FixedValueState = { [key: string]: string }; // For values that don't change with phase
type QuantityState = { [key: string]: string };
type PhaseTotalState = { [key: string]: number };
type UnitState = { [key: string]: string | null };

type EditScreenRouteProp = RouteProp<ForemanStackParamList, 'TimesheetEdit'>;
type EditScreenNavigationProp = StackNavigationProp<ForemanStackParamList, 'TimesheetEdit'>;

type Props = {
  route: EditScreenRouteProp;
  navigation: EditScreenNavigationProp;
};

type EntityType = 'material' | 'vendor' | 'equipment' | 'dumpingsite';

// --- Unit Constants ---
const MATERIAL_UNITS = [
  { label: 'Hrs', value: 'Hrs' },
  { label: 'CY', value: 'CY' },
  { label: 'TON', value: 'TON' },
  { label: 'SF', value: 'SF' },
  { label: 'SY', value: 'SY' },
  { label: 'LF', value: 'LF' },
  { label: 'EA', value: 'EA' },
  { label: 'Cube', value: 'cube' },
  { label: 'Yard', value: 'yar' },
];
const WORK_PERFORMED_UNITS = [
    { label: 'CY', value: 'CY' },
    { label: 'TON', value: 'TON' },
    { label: 'SF', value: 'SF' },
    { label: 'SY', value: 'SY' },
    { label: 'LF', value: 'LF' },
    { label: 'EA', value: 'EA' },
];


const TimesheetEditScreen: React.FC<Props> = ({ route, navigation }) => {
  const { timesheetId } = route.params;

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [foremanName, setForemanName] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [timesheetDate, setTimesheetDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [jobTitle, setJobTitle] = useState<string>('');

  const [employeeHours, setEmployeeHours] = useState<EmployeeHourState>({});
  const [equipmentHours, setEquipmentHours] = useState<ComplexHourState>({});
  const [materialHours, setMaterialHours] = useState<SimpleHourState>({});
  const [vendorHours, setVendorHours] = useState<SimpleHourState>({});
  const [totalQuantities, setTotalQuantities] = useState<QuantityState>({});
  const [materialUnits, setMaterialUnits] = useState<UnitState>({});
  const [vendorUnits, setVendorUnits] = useState<UnitState>({});
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for fixed values (independent of phase)
  const [materialTickets, setMaterialTickets] = useState<FixedValueState>({});
  const [vendorTickets, setVendorTickets] = useState<FixedValueState>({});
  const [dumpingSiteLoads, setDumpingSiteLoads] = useState<FixedValueState>({});
  const [dumpingSiteTickets, setDumpingSiteTickets] = useState<FixedValueState>({});


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get(`/api/timesheets/${timesheetId}`);
        const tsData: Timesheet = response.data;
        setTimesheet(tsData);

        if (tsData.date) setTimesheetDate(new Date(tsData.date));
        setNotes(tsData.data?.notes || '');

        const jobName = tsData.data?.job?.job_description || tsData.data?.job_name || 'Timesheet';
        setJobTitle(jobName);
        navigation.setOptions({ title: `${jobName} - Edit` });

        if (tsData.data?.job?.phase_codes?.length > 0) {
          setSelectedPhase(tsData.data.job.phase_codes[0]);
        }

        const populateSimple = (entities: any[], field: 'hoursperphase' | 'ticketsperphase'): SimpleHourState => {
            const state: SimpleHourState = {};
            entities.forEach(e => {
                state[e.id] = {};
                if (e[field]) {
                    for (const phase in e[field]) {
                        state[e.id][phase] = e[field][phase]?.toString() || '';
                    }
                }
            });
            return state;
        };

        const populateFixed = (entities: any[], field: 'hoursperphase' | 'ticketsperphase'): FixedValueState => {
            const state: FixedValueState = {};
            entities.forEach(e => {
                if (e[field] && Object.keys(e[field]).length > 0) {
                    const firstPhase = Object.keys(e[field])[0];
                    state[e.id] = e[field][firstPhase]?.toString() || '';
                } else {
                    state[e.id] = '';
                }
            });
            return state;
        };
        
        const populateEmployees = (entities: any[]): EmployeeHourState => {
            const state: EmployeeHourState = {};
            entities.forEach(e => {
                state[e.id] = {};
                if (e.hoursperphase) {
                    for (const phase in e.hoursperphase) {
                        state[e.id][phase] = {};
                        const v = e.hoursperphase[phase];
                        if (typeof v === 'object' && v) {
                            for (const classCode in v) {
                                state[e.id][phase][classCode] = (v[classCode] ?? '').toString();
                            }
                        }
                    }
                }
            });
            return state;
        };

        const populateEquipmentComplex = (entities: any[]): ComplexHourState => {
            const state: ComplexHourState = {};
            entities.forEach(e => {
                state[e.id] = {};
                if (e.hoursperphase) {
                    for (const phase in e.hoursperphase) {
                        const v = e.hoursperphase[phase];
                        if (typeof v === 'object' && v) {
                            state[e.id][phase] = {
                                REG: (v.REG ?? '').toString(),
                                SB: (v.SB ?? '').toString(),
                            };
                        } else {
                             const num = parseFloat(v ?? 0);
                             state[e.id][phase] = { REG: !isNaN(num) ? num.toString() : '' , SB: ''};
                        }
                    }
                }
            });
            return state;
        };

        const populateUnits = (entities: any[]): UnitState => {
            const state: UnitState = {};
            entities.forEach(e => {
                state[e.id] = e.unit || null;
            });
            return state;
        };

        setEmployeeHours(populateEmployees(tsData.data?.employees || []));
        setEquipmentHours(populateEquipmentComplex(tsData.data?.equipment || []));
        setMaterialHours(populateSimple(tsData.data?.materials || [], 'hoursperphase'));
        setVendorHours(populateSimple(tsData.data?.vendors || [], 'hoursperphase'));

        // Use populateFixed for tickets and loads
        setMaterialTickets(populateFixed(tsData.data?.materials || [], 'ticketsperphase'));
        setVendorTickets(populateFixed(tsData.data?.vendors || [], 'ticketsperphase'));
        setDumpingSiteLoads(populateFixed(tsData.data?.dumping_sites || [], 'hoursperphase')); // # of loads is in hoursperphase
        setDumpingSiteTickets(populateFixed(tsData.data?.dumping_sites || [], 'ticketsperphase'));

        setMaterialUnits(populateUnits(tsData.data?.materials || []));
        setVendorUnits(populateUnits(tsData.data?.vendors || []));

        if (tsData.data?.total_quantities_per_phase) {
          const q: QuantityState = {};
          for (const phase in tsData.data.total_quantities_per_phase) {
            q[phase] = String(tsData.data.total_quantities_per_phase[phase]);
          }
          setTotalQuantities(q);
        }

        const eqRes = await apiClient.get('/api/equipment');
        setAvailableEquipment(eqRes.data);

        const res = await apiClient.get(`/api/users/${tsData.foreman_id}`);
        const fn = [res.data?.firstname, res.data?.middlename, res.data?.lastname].filter(Boolean).join(' ').trim();
        setForemanName(fn);

      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load timesheet data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timesheetId, navigation]);

  const handleEmployeeHourChange = (employeeId: string, phaseCode: string, classCode: string, value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setEmployeeHours(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [phaseCode]: {
          ...prev[employeeId]?.[phaseCode],
          [classCode]: sanitized,
        },
      },
    }));
  };

  const handleComplexHourChange = (setter: React.Dispatch<React.SetStateAction<ComplexHourState>>, entityId: string, phaseCode: string, hourType: 'REG' | 'SB', value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setter(prev => ({
      ...prev,
      [entityId]: {
        ...prev[entityId],
        [phaseCode]: {
          ...prev[entityId]?.[phaseCode],
          [hourType]: sanitized
        },
      },
    }));
  };

  const handleSimpleValueChange = (entityType: 'material' | 'vendor', field: 'hours', entityId: string, phaseCode: string, value: string) => {
    const sanitize = (val: string): string => val.replace(/[^0-9.]/g, '');
    const sanitized = sanitize(value);
    const setters = {
        material: { hours: setMaterialHours },
        vendor: { hours: setVendorHours },
    };
    const setter = setters[entityType][field];
    setter(prev => ({
        ...prev,
        [entityId]: {
            ...prev[entityId],
            [phaseCode]: sanitized,
        },
    }));
  };
  
  const handleFixedValueChange = (
    setter: React.Dispatch<React.SetStateAction<FixedValueState>>,
    entityId: string,
    value: string
  ) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setter(prev => ({
      ...prev,
      [entityId]: sanitized,
    }));
  };

  const handleUnitChange = (type: 'material' | 'vendor', entityId: string, unit: string) => {
    const setter = type === 'material' ? setMaterialUnits : setVendorUnits;
    setter(prev => ({ ...prev, [entityId]: unit }));
  };

  const handleTotalQuantityChange = (phaseCode: string, value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setTotalQuantities(prev => ({ ...prev, [phaseCode]: sanitized }));
  };

  const handleRemoveEquipment = (id: string) => {
    setTimesheet(ts => {
      if (!ts) return ts;
      return {
        ...ts,
        data: {
          ...ts.data,
          equipment: (ts.data.equipment || []).filter(eq => eq.id !== id),
        },
      };
    });
    setEquipmentHours(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleAddEquipment = (item: any) => {
    if (!item || !item.value || !timesheet) return;

    const equipmentToAdd = availableEquipment.find(eq => eq.id === item.value);
    if (!equipmentToAdd) return;

    if ((timesheet.data.equipment || []).some((e: any) => e.id === equipmentToAdd.id)) {
      Alert.alert('Duplicate', 'This equipment has already been added.');
      return;
    }

    setTimesheet(ts => {
      if (!ts) return ts;
      return {
        ...ts,
        data: {
          ...ts.data,
          equipment: [...(ts.data.equipment || []), equipmentToAdd],
        },
      };
    });
    setEquipmentHours(prev => ({ ...prev, [equipmentToAdd.id]: {} }));
  };


  const handleSave = async () => {
    if (!timesheet) return;
    setIsSubmitting(true);
    try {
        const toNumbersSimple = (m: Record<string, string>): Record<string, number> => {
            const out: Record<string, number> = {};
            Object.keys(m).forEach(phase => {
                const num = parseFloat(m[phase] || '0');
                out[phase] = !isNaN(num) ? num : 0;
            });
            return out;
        };

        const expandFixedValueToPhases = (value: string, phaseCodes: string[]): Record<string, number> => {
            const out: Record<string, number> = {};
            const num = parseFloat(value || '0');
            const finalNum = !isNaN(num) ? num : 0;
            phaseCodes.forEach(phase => {
                out[phase] = finalNum;
            });
            return out;
        };

        const processEmployees = (empId: string, phaseHours: { [phase: string]: { [classCode: string]: string } }): Record<string, Record<string, number>> => {
            const out: Record<string, Record<string, number>> = {};
            Object.keys(phaseHours).forEach(phase => {
                out[phase] = {};
                const classEntries = phaseHours[phase];
                Object.keys(classEntries).forEach(classCode => {
                    const num = parseFloat(classEntries[classCode] || '0');
                    if (!isNaN(num) && num > 0) out[phase][classCode] = num;
                });
            });
            return out;
        };

        const processEquipment = (m: { [key: string]: { REG?: string; SB?: string } }): Record<string, { REG: number; SB: number }> => {
            const out: Record<string, { REG: number; SB: number }> = {};
            Object.keys(m).forEach(phase => {
                const reg = parseFloat(m[phase]?.REG || '0');
                const sb = parseFloat(m[phase]?.SB || '0');
                out[phase] = {
                    REG: isNaN(reg) ? 0 : reg,
                    SB: isNaN(sb) ? 0 : sb,
                };
            });
            return out;
        };
        
        const phaseCodes = timesheet.data.job.phase_codes || [];

        const updatedEmployees = (timesheet.data.employees || []).map(emp => ({
            ...emp,
            hoursperphase: processEmployees(emp.id, employeeHours[emp.id] || {}),
        }));
        
        const updatedEquipment = (timesheet.data.equipment || []).map(eq => ({
            ...eq,
            hoursperphase: processEquipment(equipmentHours[eq.id] || {}),
        }));
        
        const updatedMaterials = (timesheet.data.materials || []).map(mat => ({
            ...mat,
            unit: materialUnits[mat.id],
            hoursperphase: toNumbersSimple(materialHours[mat.id] || {}),
            ticketsperphase: expandFixedValueToPhases(materialTickets[mat.id], phaseCodes),
        }));

        const updatedVendors = (timesheet.data.vendors || []).map(ven => ({
            ...ven,
            unit: vendorUnits[ven.id],
            hoursperphase: toNumbersSimple(vendorHours[ven.id] || {}),
            ticketsperphase: expandFixedValueToPhases(vendorTickets[ven.id], phaseCodes),
        }));

        const updatedDumpingSites = (timesheet.data.dumping_sites || []).map(site => ({
            ...site,
            hoursperphase: expandFixedValueToPhases(dumpingSiteLoads[site.id], phaseCodes), // Loads
            ticketsperphase: expandFixedValueToPhases(dumpingSiteTickets[site.id], phaseCodes), // Tickets (Qty)
        }));

        const updatedData = {
            ...timesheet.data,
            employees: updatedEmployees,
            equipment: updatedEquipment,
            materials: updatedMaterials,
            vendors: updatedVendors,
            dumpingsites: updatedDumpingSites,
            totalquantitiesperphase: toNumbersSimple(totalQuantities),
            notes,
        };

        const payload = {
            data: updatedData,
            status: 'Pending', // use 'draft' to match backend creation logic
        };

        console.log('Saving payload:', JSON.stringify(payload, null, 2));

        await apiClient.put(`/api/timesheets/${timesheet.id}`, payload);
        Alert.alert('Success', 'Timesheet draft saved successfully!');
        navigation.goBack();
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error('Save failed:', e.message);
        } else if ((e as any)?.response?.data) {
            console.error('Save failed:', (e as any).response.data);
        } else {
            console.error('Save failed:', e);
        }
        Alert.alert('Error', 'Failed to save timesheet. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const calculateTotalEmployeeHours = (state: EmployeeHourState, entityId: string): number => {
    const entityPhases = state[entityId];
    if (!entityPhases) return 0;
    return Object.values(entityPhases).reduce((phaseTotal, classHours) => {
        const totalForPhase = Object.values(classHours).reduce((classTotal, hours) => {
            const val = parseFloat(hours || '0');
            return classTotal + (isNaN(val) ? 0 : val);
        }, 0);
        return phaseTotal + totalForPhase;
    }, 0);
  };
  
  const calculateEmployeePhaseTotals = (state: EmployeeHourState, phaseCodes: string[]): PhaseTotalState => {
      const totals: PhaseTotalState = {};
      phaseCodes.forEach(p => totals[p] = 0);
      Object.values(state).forEach(perEntity => {
          phaseCodes.forEach(p => {
              if (perEntity[p]) {
                  Object.values(perEntity[p]).forEach(hoursStr => {
                      const val = parseFloat(hoursStr || '0');
                      if (!isNaN(val)) {
                          totals[p] += val;
                      }
                  });
              }
          });
      });
      return totals;
  };
  
  const calculateTotalComplexHours = (hoursState: ComplexHourState, entityId: string): number => {
      const m = hoursState[entityId];
      if (!m) return 0;
      return Object.values(m).reduce((t, v) => {
          const reg = parseFloat(v?.REG || '0');
          const sb = parseFloat(v?.SB || '0');
          return t + (isNaN(reg) ? 0 : reg) + (isNaN(sb) ? 0 : sb);
      }, 0);
  };
  
  const calculateComplexPhaseTotals = (hoursState: ComplexHourState, phaseCodes: string[]): PhaseTotalState => {
      const totals: PhaseTotalState = {};
      phaseCodes.forEach(p => totals[p] = 0);
      Object.values(hoursState).forEach(perEntity => {
          phaseCodes.forEach(p => {
              const reg = parseFloat(perEntity[p]?.REG || '0');
              const sb = parseFloat(perEntity[p]?.SB || '0');
              if (!isNaN(reg)) totals[p] += reg;
              if (!isNaN(sb)) totals[p] += sb;
          });
      });
      return totals;
  };
  
  const calculateTotalSimple = (state: SimpleHourState, entityId: string): number => {
    const m = state[entityId];
    if (!m) return 0;
    return Object.values(m).reduce((t, v) => t + parseFloat(v || '0') || 0, 0);
  };

  const calculateSimplePhaseTotals = (state: SimpleHourState, phaseCodes: string[]): PhaseTotalState => {
      const totals: PhaseTotalState = {};
      phaseCodes.forEach(p => totals[p] = 0);
      Object.values(state).forEach(perEntity => {
          phaseCodes.forEach(p => {
              const val = parseFloat(perEntity[p] || '0');
              if (!isNaN(val)) {
                  totals[p] += val;
              }
          });
      });
      return totals;
  };

  const renderEmployeeInputs = () => {
    if (!timesheet?.data?.employees || !timesheet.data.job?.phase_codes) return null;
    const phaseCodes = timesheet.data.job.phase_codes;
    const phaseTotals = calculateEmployeePhaseTotals(employeeHours, phaseCodes);
    const employees = timesheet.data.employees;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Employees</Text>
        {employees.map((entity, index) => {
          const total = calculateTotalEmployeeHours(employeeHours, entity.id);
          const name = [entity.first_name, entity.middle_name, entity.last_name].filter(Boolean).join(' ').trim();
          const isLast = index === employees.length - 1;
          const classCodes = [entity.class_1, entity.class_2].filter(Boolean);
          const classCodeString = classCodes.join(', ');

          return (
            <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
               <View style={styles.entityHeader}>
                    <Text style={styles.employeeName}>{name}</Text>
                    <Text style={styles.employeeId}>EMP ID: {entity.id}</Text>
                </View>

                <View style={styles.controlsRow}>
                    <View style={styles.hoursContainer}>
                        <View style={styles.inputWithLabel}>
                            <Text style={styles.inputHeader}>Class Codes</Text>
                            <Text style={styles.classCodeSummary}>{classCodeString}</Text>
                        </View>
                        {classCodes.map((cc) => (
                           <View style={styles.inputWithLabel} key={cc}>
                               <Text style={styles.inputHeader}>Hours</Text>
                               <TextInput
                                   style={styles.input}
                                   keyboardType="numeric"
                                   placeholder="0"
                                   value={(employeeHours[entity.id]?.[selectedPhase ?? '']?.[cc as string] as string) ?? ''}
                                   onChangeText={(text) => selectedPhase && handleEmployeeHourChange(entity.id, selectedPhase, cc as string, text)}
                               />
                                <Text style={styles.employeeClassCodeFooter}>{cc as string}</Text>
                           </View>
                        ))}
                         <View style={styles.inputWithLabel}>
                            <Text style={styles.inputHeader}>Total</Text>
                            <View style={styles.totalBox}><Text style={styles.totalText}>{total.toFixed(1)}</Text></View>
                        </View>
                    </View>
                </View>
            </View>
          );
        })}
        <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total Hours:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsContainer}>
                {timesheet.data.job.phase_codes?.map((phase: string) => (
                    <View key={phase} style={styles.totalPhaseItem}>
                        <Text style={styles.totalPhaseHeader}>{phase}</Text>
                        <View style={styles.totalBox}><Text style={styles.totalText}>{phaseTotals[phase]?.toFixed(1) ?? '0.0'}</Text></View>
                    </View>
                ))}
            </ScrollView>
        </View>
      </View>
    );
  };
  
  const renderEntityInputs = (title: string, entities: any[] | undefined, type: EntityType) => {
    if (!entities || entities.length === 0) return null;
  
    const isEquipment = type === 'equipment';
    const isMaterial = type === 'material';
    const isVendor = type === 'vendor';
    const isDumpingSite = type === 'dumpingsite';
    
    if (!timesheet?.data?.job?.phase_codes) return null;

    const hoursState = isEquipment ? equipmentHours : isMaterial ? materialHours : vendorHours;
    const phaseHourTotals = isEquipment 
        ? calculateComplexPhaseTotals(hoursState as ComplexHourState, timesheet.data.job.phase_codes)
        : calculateSimplePhaseTotals(hoursState as SimpleHourState, timesheet.data.job.phase_codes);

    const getHeader = (fieldType: 'hours' | 'tickets') => {
        if (isMaterial) return fieldType === 'hours' ? 'Hrs' : 'Qty of Tickets';
        if (isVendor) return fieldType === 'hours' ? 'Qty' : 'of Tickets';
        if (isDumpingSite) return fieldType === 'hours' ? '# of Loads' : 'Qty';
        return 'Hours';
    };

    const calculateLabor = (matId: string, phase: string) => {
        const totalHours = parseFloat(materialHours[matId]?.[phase] || '0');
        const totalQty = parseFloat(materialTickets[matId] || '0');
        if (totalQty > 0) return (totalHours / totalQty).toFixed(2);
        return '0.00';
    };
    
    // Specific render for Dumping Site
    if (isDumpingSite) {
        return (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>{title}</Text>
                {entities.map(entity => (
                    <View key={entity.id} style={styles.entityContainer}>
                        <Text style={styles.inputLabel}>{entity.name}</Text>
                        <View style={styles.controlsRow}>
                            <View style={styles.hoursContainer}>
                                <View style={[styles.inputWithLabel, { marginLeft: 0 }]}>
                                    <Text style={styles.inputHeader}># of Loads</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        value={dumpingSiteLoads[entity.id] ?? ''}
                                        onChangeText={(text) => handleFixedValueChange(setDumpingSiteLoads, entity.id, text)}
                                    />
                                </View>
                                <View style={styles.inputWithLabel}>
                                    <Text style={styles.inputHeader}>Qty</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        value={dumpingSiteTickets[entity.id] ?? ''}
                                        onChangeText={(text) => handleFixedValueChange(setDumpingSiteTickets, entity.id, text)}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        );
    }
  
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        {entities.map((entity, index) => {
            const totalHours = isEquipment 
              ? calculateTotalComplexHours(hoursState as ComplexHourState, entity.id)
              : calculateTotalSimple(hoursState as SimpleHourState, entity.id);
            const name = isEquipment ? `${entity.id} - ${entity.name}` : entity.name;
            const isLast = index === entities.length - 1;

          return (
            <View key={entity.id} style={[styles.entityContainer, isLast && styles.lastEntityContainer]}>
              {isEquipment ? (
                <View style={styles.entityHeader}>
                    <Text style={styles.employeeName}>{entity.name}</Text>
                    <Text style={styles.employeeId}>EQP ID: {entity.id}</Text>
                </View>
              ) : (
                <Text style={styles.inputLabel}>{name}</Text>
              )}
              <View style={styles.controlsRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.entityInputRow}>
                    <View style={styles.hoursContainer}>
                      {isEquipment ? (
                        <>
                          <View style={styles.inputWithLabel}>
                            <Text style={styles.inputHeader}>REG</Text>
                            <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={equipmentHours[entity.id]?.[selectedPhase ?? '']?.REG ?? ''} onChangeText={(text) => selectedPhase && handleComplexHourChange(setEquipmentHours, entity.id, selectedPhase, 'REG', text)} />
                          </View>
                          <View style={styles.inputWithLabel}>
                            <Text style={styles.inputHeader}>S.B</Text>
                            <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={equipmentHours[entity.id]?.[selectedPhase ?? '']?.SB ?? ''} onChangeText={(text) => selectedPhase && handleComplexHourChange(setEquipmentHours, entity.id, selectedPhase, 'SB', text)} />
                          </View>
                        </>
                      ) : (
                        <>
                            <View style={styles.inputWithLabel}>
                                <Text style={styles.inputHeader}>{getHeader('hours')}</Text>
                                <TextInput style={styles.input} keyboardType="numeric" placeholder="0"
                                    value={(hoursState as SimpleHourState)[entity.id]?.[selectedPhase ?? ''] ?? ''}
                                    onChangeText={(text) => selectedPhase && handleSimpleValueChange(type as 'material' | 'vendor', 'hours', entity.id, selectedPhase, text)}
                                />
                            </View>
                            <View style={styles.inputWithLabel}>
                                <Text style={styles.inputHeader}>{getHeader('tickets')}</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                    value={isMaterial ? materialTickets[entity.id] : vendorTickets[entity.id]}
                                    onChangeText={(text) => handleFixedValueChange(isMaterial ? setMaterialTickets : setVendorTickets, entity.id, text)}
                                />
                            </View>
                        </>
                      )}
  
                        {(isMaterial || isVendor) && (
                            <View style={styles.inputWithLabel}>
                                <Text style={styles.inputHeader}>Unit</Text>
                                <Dropdown
                                    style={[styles.dropdown, styles.unitDropdown, {width: 80}]}
                                    data={isMaterial ? MATERIAL_UNITS : WORK_PERFORMED_UNITS}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="-"
                                    value={(isMaterial ? materialUnits[entity.id] : vendorUnits[entity.id]) ?? null}
                                    onChange={item => handleUnitChange(type as 'material' | 'vendor', entity.id, item.value)}
                                    maxHeight={200}
                                />
                            </View>
                        )}
                        <View style={styles.inputWithLabel}>
                            <Text style={styles.inputHeader}>Total</Text>
                            <View style={styles.totalBox}><Text style={styles.totalText}>{totalHours.toFixed(1)}</Text></View>
                        </View>
                    </View>
                    
                    {isMaterial && selectedPhase && (
                      <View style={styles.laborRateContainer}>
                          <Text style={styles.laborRateLabel}>Labor Rate (Hrs/Qty): </Text>
                          <Text style={styles.laborRateValue}>{calculateLabor(entity.id, selectedPhase)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                {isEquipment ? (
                  <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveEquipment(entity.id)}>
                      <Text style={styles.removeButtonText}>X</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{width: 44, marginLeft: 10}} /> /* Spacer */
                )}
              </View>
            </View>
          );
        })}
        
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>{isMaterial ? 'Truck Hrs/Mat Qty/Phase' : isVendor ? 'Total Qty/Phase' : 'Total Hours'}:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.totalsContainer}>
            {timesheet.data.job.phase_codes.map((phase: string) => (
                <View key={`${phase}-h`} style={styles.totalPhaseItem}>
                  <Text style={styles.totalPhaseHeader}>{phase}</Text>
                  <View style={styles.totalBox}><Text style={styles.totalText}>{phaseHourTotals[phase]?.toFixed(1) ?? '0.0'}</Text></View>
                </View>
            ))}
          </ScrollView>
        </View>

        {isEquipment && (
            <View style={styles.addEquipmentRow}>
                <Dropdown
                    style={[styles.dropdown, { flex: 1 }]}
                    data={availableEquipment
                        .filter(eq => !(timesheet?.data.equipment || []).some((e: any) => e.id === eq.id))
                        .map(eq => ({ label: `${eq.id} - ${eq.name}`, value: eq.id }))}
                    labelField="label"
                    valueField="value"
                    placeholder="Select equipment to add"
                    value={null}
                    onChange={handleAddEquipment}
                    maxHeight={200}
                    search
                    searchPlaceholder='Search...'
                />
            </View>
        )}
      </View>
    );
  };
  

  if (loading) return <ActivityIndicator size="large" style={styles.centered} />;
  if (!timesheet) return <View style={styles.centered}><Text>Timesheet not found</Text></View>;

  const { data } = timesheet;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: THEME.SPACING, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <Text style={styles.jobTitle}>{data.job_name}</Text>
          <Text style={styles.jobCode}>Job Code: {data.job?.job_code ?? 'N/A'}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
                <Text style={styles.infoValueClickable}>{timesheetDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Foreman</Text><Text style={styles.infoValue}>{foremanName}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Project Engineer</Text><Text style={styles.infoValue}>{data.project_engineer || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Day</Text><Text style={styles.infoValue}>{data.time_of_day || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>{data.location || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Weather</Text><Text style={styles.infoValue}>{data.weather || 'N/A'}</Text></View>
            <View style={styles.infoItem}><Text style={styles.infoLabel}>Temperature</Text><Text style={styles.infoValue}>{data.temperature || 'N/A'}</Text></View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseSelectorContainer}>
          {data.job?.phase_codes?.map((phase: string) => (
            <TouchableOpacity key={phase} style={[styles.phaseButton, selectedPhase === phase && styles.selectedPhaseButton]} onPress={() => setSelectedPhase(phase)}>
              <Text style={[styles.phaseButtonText, selectedPhase === phase && styles.selectedPhaseButtonText]}>{phase}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedPhase && (
          <View>
            {renderEmployeeInputs()}
            {renderEntityInputs('Equipment', data.equipment, 'equipment')}
            {renderEntityInputs('Materials and Trucking', data.materials, 'material')}
            {renderEntityInputs('Work Performed', data.vendors, 'vendor')}
            {renderEntityInputs('Dumping Sites', data.dumping_sites, 'dumpingsite')}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Total Quantity</Text>
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Phase {selectedPhase}</Text>
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  keyboardType="numeric"
                  placeholder="Enter quantity"
                  value={totalQuantities[selectedPhase] ?? ''}
                  onChangeText={text => handleTotalQuantityChange(selectedPhase, text)}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            maxLength={300}
            placeholder="Enter any notes for this timesheet..."
            value={notes}
            onChangeText={setNotes}
          />
          <Text style={styles.characterCount}>{notes.length} / 300</Text>
        </View>
      </ScrollView>

      <DatePicker
        modal
        open={isDatePickerVisible}
        date={timesheetDate}
        mode="date"
        onConfirm={d => {
          setDatePickerVisible(false);
          setTimesheetDate(d);
          const newDateString = d.toISOString().split('T')[0];
          setTimesheet(prev => {
            if (prev === null) return null;
            return {
              ...prev,
              date: newDateString,
              data: {
                  ...(prev.data),
                  date: newDateString,
              }
            };
          });
        }}
        onCancel={() => setDatePickerVisible(false)}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.submitButton, { backgroundColor: isSubmitting ? THEME.textSecondary : THEME.primary }]} onPress={handleSave} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Save Draft</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
    classCodeSummary: {
        fontSize: 14,
        fontWeight: '600',
        paddingVertical: 5,
        height: 40,
        textAlignVertical: 'center',
    },
    employeeClassCodeFooter: {
        fontSize: 10,
        color: '#333',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 0,
    },
  safeArea: { flex: 1, backgroundColor: THEME.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
  infoCard: {
    padding: THEME.SPACING,
    backgroundColor: THEME.card,
    borderRadius: 14,
    marginBottom: THEME.SPACING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  jobTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
  jobCode: { fontSize: 16, color: THEME.textSecondary, marginTop: 4 },
  infoGrid: { marginTop: THEME.SPACING, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoItem: { width: '48%', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: THEME.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '500', color: THEME.text },
  infoValueClickable: { fontSize: 16, fontWeight: '500', color: THEME.primary },
  phaseSelectorContainer: { marginVertical: THEME.SPACING / 2 },
  phaseButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  selectedPhaseButton: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  phaseButtonText: { color: THEME.text, fontWeight: '600', fontSize: 16 },
  selectedPhaseButtonText: { color: '#FFF' },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 14,
    padding: THEME.SPACING,
    marginBottom: THEME.SPACING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.text, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: THEME.border },
  entityContainer: { paddingVertical: THEME.SPACING, borderBottomWidth: 1, borderBottomColor: THEME.border },
  lastEntityContainer: { borderBottomWidth: 0, paddingBottom: 0 },
  entityHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  employeeName: {fontSize: 16, fontWeight: 'bold', flexShrink: 1, marginRight: 10},
  employeeId: {fontSize: 14, color: '#666', flexShrink: 0, marginLeft: 'auto', fontWeight: 'bold'},
  inputLabel: { fontSize: 18, color: THEME.text, marginBottom: 12, fontWeight: '600' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hoursContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', flex: 1, flexWrap: 'wrap' },
  entityInputRow: { flexDirection: 'row', alignItems: 'flex-end', },
  inputWithLabel: { alignItems: 'center', marginLeft: 10, },
  inputHeader: { fontSize: 13, color: THEME.textSecondary, marginBottom: 4, fontWeight: '500' },
  input: {
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 48,
    width: 65,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: THEME.text,
    backgroundColor: THEME.lightGray,
  },
  totalBox: {
    backgroundColor: THEME.background,
    borderRadius: 10,
    height: 48,
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  totalText: { fontSize: 16, fontWeight: 'bold', color: THEME.text },
  dropdown: {
    height: 48,
    borderColor: THEME.border,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: THEME.lightGray,
  },
  unitDropdown: { width: 180, marginLeft: 10 },
  removeButton: {
    marginLeft: 10,
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF3B301A',
  },
  removeButtonText: { color: THEME.danger, fontWeight: 'bold', fontSize: 20, },
  addEquipmentRow: { marginTop: THEME.SPACING, borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: THEME.SPACING },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantityLabel: { fontSize: 16, fontWeight: '500', color: THEME.text },
  quantityInput: { width: 150 },
  totalsRow: { flexDirection: 'row', alignItems: 'center', marginTop: THEME.SPACING, paddingTop: THEME.SPACING, borderTopWidth: 1, borderTopColor: THEME.border, },
  totalsLabel: { fontSize: 16, fontWeight: 'bold', color: THEME.text, marginRight: 10 },
  totalsContainer: { flexDirection: 'row' },
  totalPhaseItem: { alignItems: 'center', marginHorizontal: 4 },
  totalPhaseHeader: { fontSize: 12, color: THEME.textSecondary, marginBottom: 4 },
  footer: {
    padding: THEME.SPACING,
    backgroundColor: THEME.card,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  submitButton: {
    padding: THEME.SPACING,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  submitButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  notesInput: {
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 10,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: THEME.text,
    backgroundColor: THEME.lightGray,
  },
  characterCount: { fontSize: 12, color: THEME.textSecondary, textAlign: 'right', marginTop: 4 },
    laborRateContainer: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },
    laborRateLabel: {
        fontSize: 14,
        color: THEME.textSecondary,
    },
    laborRateValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: THEME.text,
    },
});

export default TimesheetEditScreen;
