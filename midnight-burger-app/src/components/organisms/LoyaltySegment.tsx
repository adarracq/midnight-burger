// src/components/organisms/LoyaltySegment.tsx
import { Colors } from '@/src/constants/theme';
import { doc, onSnapshot } from 'firebase/firestore';
import { Hamburger } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import { Typography } from '../atoms/Typography';
import { Leaderboard } from './Leaderboard';

interface LoyaltySegmentProps {
    userData: any; // On garde la prop initiale pour le premier affichage rapide
}

export const LoyaltySegment = ({ userData: initialUserData }: LoyaltySegmentProps) => {
    // 🟢 On crée un état local qui prend la donnée initiale, puis qui se mettra à jour
    const [userData, setUserData] = useState(initialUserData);

    // 🟢 Écoute en temps réel du profil utilisateur
    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        // onSnapshot va s'activer automatiquement à chaque fois que le solde change
        const unsubscribe = onSnapshot(doc(db, 'users', userId), (docSnap) => {
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            }
        });

        return () => unsubscribe();
    }, []);

    // On récupère les deux variables depuis notre état en temps réel
    const loyaltyPoints = userData?.loyaltyPoints || 0;
    const lifetimePoints = userData?.lifetimePoints || 0;

    const progressPercentage = Math.min((loyaltyPoints / 100) * 100, 100);

    return (
        <View style={styles.container}>
            <Typography variant="body" style={styles.sectionSubtitle}>MON STATUT</Typography>

            <View style={styles.loyaltyBanner}>
                <View style={styles.loyaltyHeader}>
                    <View style={styles.loyaltyInfo}>
                        <Typography variant="subtitle" style={styles.loyaltyTitle}>Points disponibles</Typography>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Hamburger size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                            <Typography variant="body" style={styles.loyaltySubtitleText}>
                                {loyaltyPoints >= 100
                                    ? "Burger offert disponible !"
                                    : `${100 - loyaltyPoints} pts avant ton burger offert`}
                            </Typography>
                        </View>
                    </View>
                    <View style={styles.pointsBadge}>
                        <Typography variant="title" style={styles.pointsBadgeText}>{loyaltyPoints}</Typography>
                    </View>
                </View>

                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                </View>

                {/* Ajout du score total (lifetimePoints) pour éviter la confusion */}
                <View style={styles.lifetimeBox}>
                    <Typography variant="body" style={styles.lifetimeText}>
                        Score cumulé au classement : <Typography variant="body" style={styles.lifetimeBold}>{lifetimePoints} pts</Typography>
                    </Typography>
                </View>
            </View>

            <View style={styles.spacer} />
            <Leaderboard />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
    },
    spacer: {
        height: 24,
    },
    sectionSubtitle: {
        fontSize: 12,
        fontFamily: 'Inter_600SemiBold',
        color: Colors.textMuted,
        letterSpacing: 1.2,
        marginBottom: 10,
        marginLeft: 8,
    },
    loyaltyBanner: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    loyaltyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    loyaltyInfo: {
        flex: 1,
        paddingRight: 10,
    },
    loyaltyTitle: {
        fontSize: 16,
        marginBottom: 4,
        color: Colors.text,
    },
    loyaltySubtitleText: {
        fontSize: 13,
        color: Colors.primary,
        marginBottom: 0,
    },
    pointsBadge: {
        backgroundColor: Colors.primaryMuted,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    pointsBadgeText: {
        color: Colors.primary,
        fontSize: 20,
        marginBottom: 0,
    },
    progressBarBg: {
        width: '100%',
        height: 6,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
    lifetimeBox: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceBorder,
    },
    lifetimeText: {
        fontSize: 13,
        color: Colors.textMuted,
        marginBottom: 0,
    },
    lifetimeBold: {
        fontSize: 13,
        color: Colors.text,
        fontFamily: 'Inter_700Bold',
        marginBottom: 0,
    }
});