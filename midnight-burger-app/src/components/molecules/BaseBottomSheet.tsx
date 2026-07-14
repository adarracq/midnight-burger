// src/components/molecules/BaseBottomSheet.tsx
import { Colors } from '@/src/constants/theme';
import { feedbackService } from '@/src/services/feedbackService';
import React, { ReactNode } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Typography } from '../atoms/Typography';

interface BaseBottomSheetProps {
    isVisible: boolean;
    title?: string;
    onClose: () => void;
    children: ReactNode;
}

export const BaseBottomSheet = ({ isVisible, title, onClose, children }: BaseBottomSheetProps) => {
    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => { feedbackService.light(); onClose(); }}
            statusBarTranslucent={true}
        >
            <TouchableWithoutFeedback onPress={() => { feedbackService.light(); onClose(); }}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.sheetContainer}>
                    <View style={styles.dragPillContainer}>
                        <View style={styles.dragPill} />
                    </View>

                    <View style={styles.header}>
                        <View style={styles.headerSpacer} />
                        {title && (
                            <Typography variant="subtitle" style={styles.title}>
                                {title}
                            </Typography>
                        )}
                        <TouchableOpacity style={styles.closeButton} onPress={() => { feedbackService.light(); onClose(); }}>
                            <Typography variant="body" style={styles.closeText}>✕</Typography>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {children}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        // 🟢 FINI le flex: 1. On limite juste la hauteur max pour que ça ne touche pas le haut de l'écran.
        maxHeight: '90%',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    dragPillContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    dragPill: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.surfaceBorder,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder,
    },
    headerSpacer: {
        width: 32,
    },
    title: {
        marginBottom: 0,
        fontSize: 18,
        textAlign: 'center',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.surfaceLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: {
        marginBottom: 0,
        fontSize: 16,
        color: Colors.textMuted,
        lineHeight: 20,
    },
    content: {
        // 🟢 flexShrink: 1 permet au contenu de s'adapter à sa propre taille, 
        // tout en l'autorisant à se compresser et scroller si on dépasse les 90% d'écran.
        flexShrink: 1,
    },
});