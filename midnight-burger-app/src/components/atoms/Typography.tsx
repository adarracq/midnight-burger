// src/components/atoms/Typography.tsx
import { Colors } from '@/src/constants/theme';
import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';

interface TypographyProps extends TextProps {
    variant?: 'title' | 'subtitle' | 'body' | 'price';
}

export const Typography = ({ variant = 'body', style, children, ...props }: TypographyProps) => {
    return (
        <Text style={[styles[variant], style]} {...props}>
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 28,
        fontFamily: 'Inter_700Bold', // Remplace fontWeight: 'bold'
        color: Colors.text
    },
    subtitle: {
        fontSize: 18,
        fontFamily: 'Inter_600SemiBold', // Un peu moins lourd que Bold pour l'élégance
        color: Colors.text,
        marginBottom: 5
    },
    body: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: Colors.textMuted,
        marginBottom: 8
    },
    price: {
        fontSize: 16,
        fontFamily: 'Inter_700Bold',
        color: Colors.text
    },
});