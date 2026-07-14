// src/components/molecules/CustomAlert.tsx
import { Colors } from '@/src/constants/theme';
import { feedbackService } from '@/src/services/feedbackService';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Typography } from '../atoms/Typography';

interface CustomAlertProps {
    isVisible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    showCancel?: boolean;
    confirmText?: string;
    cancelText?: string;
    onClose: () => void;
    onConfirm?: () => void;
}

export const CustomAlert = ({
    isVisible,
    title,
    message,
    type = 'info',
    showCancel = false,
    confirmText = 'Fermer',
    cancelText = 'Annuler',
    onClose,
    onConfirm
}: CustomAlertProps) => {

    const getIconConfig = () => {
        switch (type) {
            case 'success':
                return { name: 'checkmark-circle', color: Colors.success };
            case 'error':
                return { name: 'warning', color: Colors.error };
            case 'warning':
                return { name: 'alert-circle', color: Colors.warning || '#E8A74D' };
            default:
                return { name: 'information-circle', color: Colors.primary };
        }
    };

    const iconConfig = getIconConfig();
    const isDestructive = type === 'error';

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => { feedbackService.light(); onClose(); }}
        >
            <TouchableWithoutFeedback onPress={() => { feedbackService.light(); onClose(); }}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.alertCard}>

                            <Ionicons name={iconConfig.name as any} size={48} color={iconConfig.color} style={styles.icon} />

                            <Typography variant="title" style={styles.title}>
                                {title}
                            </Typography>

                            <Typography variant="body" style={styles.message}>
                                {message}
                            </Typography>

                            <View style={styles.actionsContainer}>
                                {showCancel && (
                                    <TouchableOpacity style={[styles.button, styles.cancelButton]}
                                        onPress={() => { feedbackService.light(); onClose(); }}>
                                        <Typography variant="body" style={styles.cancelText}>
                                            {cancelText}
                                        </Typography>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        styles.confirmButton,
                                        isDestructive && styles.destructiveButton,
                                        !showCancel && { width: '100%' }
                                    ]}
                                    onPress={() => { feedbackService.light(); (onConfirm || onClose)(); }}
                                >
                                    <Typography variant="body" style={[
                                        styles.confirmText,
                                        isDestructive && styles.destructiveText
                                    ]}>
                                        {confirmText}
                                    </Typography>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    alertCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: Colors.backgroundLight,
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    icon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        textAlign: 'center',
        color: Colors.textMuted,
        marginBottom: 24,
        lineHeight: 20,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: Colors.surfaceLight,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    destructiveButton: {
        backgroundColor: Colors.error + '20', // Rouge translucide
        borderColor: Colors.error + '50',
    },
    cancelText: {
        color: Colors.text,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 0,
    },
    confirmText: {
        color: Colors.text,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 0,
    },
    destructiveText: {
        color: Colors.error,
    },
});