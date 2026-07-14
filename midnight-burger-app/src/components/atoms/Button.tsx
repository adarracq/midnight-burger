// src/components/atoms/Button.tsx
import { Colors } from '@/src/constants/theme';
import { feedbackService } from '@/src/services/feedbackService';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    onPress?: () => void;
    loading?: boolean;
    variant?: 'primary' | 'secondary';
}

export const Button = ({ title, loading, variant = 'primary', style, ...props }: ButtonProps) => {
    const isPrimary = variant === 'primary';

    return (
        <TouchableOpacity
            style={[
                styles.button,
                isPrimary ? styles.primary : styles.secondary,
                style,
                props.disabled && styles.disabled
            ]}
            activeOpacity={0.8}
            {...props}
            onPress={() => { feedbackService.light(); props.onPress && props.onPress(); }}
        >
            {loading ? (
                // Le loader s'adapte à la couleur du bouton
                <ActivityIndicator color={isPrimary ? '#000000' : Colors.text} />
            ) : (
                <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textSecondary]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 20, // Arrondi premium type iOS
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    primary: {
        backgroundColor: Colors.primary,

    },
    secondary: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder
    },
    disabled: {
        opacity: 0.5
    },
    text: {
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold', // La typo propre d'iOS
    },
    textPrimary: {
        color: '#000000', // Texte noir pour un contraste parfait sur le jaune
    },
    textSecondary: {
        color: Colors.text, // Texte blanc sur la carte sombre
    }
});