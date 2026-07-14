// src/components/atoms/AddButton.tsx
import { Colors } from '@/src/constants/theme';
import { feedbackService } from '@/src/services/feedbackService';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface AddButtonProps {
    onPress: () => void;
}

export const AddButton = ({ onPress }: AddButtonProps) => {
    return (
        <TouchableOpacity style={styles.button} onPress={() => { onPress(); feedbackService.light(); }}>
            <Plus color={Colors.text} size={16} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: { width: 40, height: 40, borderRadius: 16, backgroundColor: Colors.surfaceLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
});