import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import Modal from '../../../common/Modal';
import { useAuth } from '../../../../context/AuthContext';
import { COLORS } from '../../../../lib/constants';

const CreateLeagueModal = ({ onClose }) => {
    const { createLeague } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        seasonStart: '',
        seasonEnd: '',
        gameFrequency: 'Weekly',
        gameDays: [], 
        earliestGameTime: '08:00',
        latestGameTime: '22:00',
        registrationDeadline: ''
    });

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleDay = (day) => {
        setFormData(prev => {
            const days = prev.gameDays.includes(day)
                ? prev.gameDays.filter(d => d !== day)
                : [...prev.gameDays, day];
            return { ...prev, gameDays: days };
        });
    };

    const handleSubmit = async () => {
        if (!formData.name) { Alert.alert("Error", "Name required"); return; }
        const success = await createLeague(formData);
        if (success) onClose();
    };

    return (
        <Modal title="Create New League" onClose={onClose}>
            <ScrollView style={{ maxHeight: 500 }}>
                <Text style={styles.label}>League Name</Text>
                <TextInput 
                    style={styles.input} 
                    value={formData.name} 
                    onChangeText={t => handleChange('name', t)} 
                    placeholderTextColor="#666"
                />

                <Text style={styles.label}>Description</Text>
                <TextInput 
                    style={[styles.input, { height: 80 }]} 
                    multiline 
                    value={formData.description} 
                    onChangeText={t => handleChange('description', t)} 
                    placeholderTextColor="#666"
                />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Season Start (YYYY-MM-DD)</Text>
                        <TextInput 
                            style={styles.input} 
                            value={formData.seasonStart} 
                            onChangeText={t => handleChange('seasonStart', t)} 
                            placeholder="2024-01-01"
                            placeholderTextColor="#666"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Season End</Text>
                        <TextInput 
                            style={styles.input} 
                            value={formData.seasonEnd} 
                            onChangeText={t => handleChange('seasonEnd', t)} 
                            placeholder="2024-06-01"
                            placeholderTextColor="#666"
                        />
                    </View>
                </View>

                <Text style={styles.label}>Game Days</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
                    {daysOfWeek.map(day => (
                        <TouchableOpacity 
                            key={day} 
                            onPress={() => toggleDay(day)}
                            style={[
                                styles.dayTag, 
                                formData.gameDays.includes(day) && styles.dayTagActive
                            ]}
                        >
                            <Text style={{ color: 'white', fontSize: 12 }}>{day}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                        <Text style={{ color: '#ccc' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Create League</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    label: { color: '#888', fontSize: 12, marginBottom: 5, marginTop: 10 },
    input: { backgroundColor: '#333', color: 'white', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#555' },
    row: { flexDirection: 'row' },
    dayTag: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, backgroundColor: '#444' },
    dayTagActive: { backgroundColor: COLORS.success },
    footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 15 },
    submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    cancelBtn: { paddingVertical: 10, paddingHorizontal: 10 }
});

export default CreateLeagueModal;