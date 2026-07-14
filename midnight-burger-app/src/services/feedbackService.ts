import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Gère l'état global (pourra être relié à un Zustand "SettingsStore" plus tard)
let isHapticsEnabled = true;


export const feedbackService = {
    // --- VIBRATIONS (HAPTICS) SEULES ---

    light() {
        if (!isHapticsEnabled || Platform.OS === 'web') return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },

    medium() {
        if (!isHapticsEnabled || Platform.OS === 'web') return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },

    heavy() {
        if (!isHapticsEnabled || Platform.OS === 'web') return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    },

    error() {
        if (!isHapticsEnabled || Platform.OS === 'web') return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },

    // --- MIXTES : VIBRATIONS + SONS ---

    success() {
        if (isHapticsEnabled && Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    },

};