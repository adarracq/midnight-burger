// src/components/organisms/Leaderboard.tsx
import { Colors } from '@/src/constants/theme';
import { feedbackService } from '@/src/services/feedbackService';
import { Ionicons } from '@expo/vector-icons';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebaseConfig';
import { Typography } from '../atoms/Typography';
import { CustomAlert } from '../molecules/CustomAlert';

interface Leader {
    id: string;
    pseudo: string;
    points: number;
}

export const Leaderboard = () => {
    const [leaders, setLeaders] = useState<Leader[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInfoVisible, setIsInfoVisible] = useState(false);

    useEffect(() => {
        const q = query(
            collection(db, 'leaderboard'),
            orderBy('points', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLeaders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Leader[];

            setLeaders(fetchedLeaders);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const infoMessage =
        "1€ dépensé = 1 point.\n" +
        "Atteins 100 points pour débloquer un burger gratuit !\n\n" +
        "Avantages en direct du Top 5 :\n" +
        "🥇 1er : -20%\n" +
        "🥈 2ème : -15%\n" +
        "🥉 3ème : -10%\n" +
        "4ème & 5ème : Canette offerte";

    return (
        <View style={styles.container}>

            {/* En-tête avec Bouton Info */}
            <View style={styles.headerRow}>
                <Typography variant="body" style={styles.sectionSubtitle}>CLASSEMENT GÉNÉRAL</Typography>
                <TouchableOpacity onPress={() => { feedbackService.light(); setIsInfoVisible(true); }} style={styles.infoButton}>
                    <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.box}>
                {loading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                    </View>
                ) : leaders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="analytics-outline" size={32} color={Colors.textMuted} style={{ marginBottom: 12 }} />
                        <Typography variant="body" style={{ color: Colors.textMuted }}>Le classement est encore vide</Typography>
                    </View>
                ) : (
                    leaders.map((leader, index) => (
                        <LeaderRow
                            key={leader.id}
                            leader={leader}
                            rank={index + 1}
                            isLast={index === leaders.length - 1}
                        />
                    ))
                )}
            </View>

            {/* Modale d'informations métier */}
            <CustomAlert
                isVisible={isInfoVisible}
                title="Comment ça marche ?"
                message={infoMessage}
                type="info"
                confirmText="J'ai compris"
                onClose={() => setIsInfoVisible(false)}
            />
        </View>
    );
};

const LeaderRow = ({ leader, rank, isLast }: { leader: Leader, rank: number, isLast: boolean }) => {
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const isThird = rank === 3;
    const isFourthOrFifth = rank === 4 || rank === 5;

    const goldColor = Colors.gold || '#D4AF37';
    const silverColor = Colors.silver || '#C0C0C0';
    const bronzeColor = Colors.bronze || '#CD7F32';

    let rankColor: string = Colors.textMuted;
    let rankIcon = null;
    let highlightStyle = {};
    let rewardText = null;

    if (isFirst) {
        rankColor = goldColor;
        rankIcon = "trophy";
        highlightStyle = { backgroundColor: `${goldColor}15` };
        rewardText = "-20%";
    } else if (isSecond) {
        rankColor = silverColor;
        rankIcon = "medal";
        highlightStyle = { backgroundColor: `${silverColor}10` };
        rewardText = "-15%";
    } else if (isThird) {
        rankColor = bronzeColor;
        rankIcon = "medal";
        highlightStyle = { backgroundColor: `${bronzeColor}10` };
        rewardText = "-10%";
    } else if (isFourthOrFifth) {
        rewardText = "Canette offerte";
    }

    return (
        <View style={[
            styles.row,
            !isLast && styles.borderBottom,
            highlightStyle
        ]}>
            <View style={styles.rankContainer}>
                {rankIcon ? (
                    <Ionicons name={rankIcon as any} size={20} color={rankColor} />
                ) : (
                    <Typography variant="subtitle" style={{ color: Colors.textMuted, marginBottom: 0 }}>
                        {rank}
                    </Typography>
                )}
            </View>

            {/* 🟢 Le conteneur du nom et du badge alignés sur la même ligne */}
            <View style={styles.labelContainer}>
                <Typography
                    variant="body"
                    style={[styles.nameText,
                    isFirst && { color: goldColor },
                    isSecond && { color: silverColor },
                    isThird && { color: bronzeColor }
                    ]}
                    numberOfLines={1} // Empêche le nom de passer à la ligne
                >
                    {leader.pseudo}
                </Typography>

                {rewardText && (
                    <View style={[styles.rewardBadge, {
                        backgroundColor: isFirst ? goldColor + '20' : isSecond ? silverColor + '20' : isThird ? bronzeColor + '20' : Colors.info + '20'
                    }]}>
                        <Typography variant="body" style={[styles.rewardText, {
                            color: isFirst ? goldColor : isSecond ? silverColor : isThird ? bronzeColor : Colors.info
                        }]}>
                            {rewardText}
                        </Typography>
                    </View>
                )}
            </View>

            <View style={styles.statsContainer}>
                <Typography variant="body" style={[styles.pointsText, { color: isFirst ? goldColor : isSecond ? silverColor : isThird ? bronzeColor : Colors.text }]}>
                    {leader.points} pts
                </Typography>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 10,
        paddingBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 16,
    },
    title: {
        marginBottom: 0,
        fontSize: 18,
    },
    infoButton: {
        padding: 4,
    },
    box: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    loadingState: {
        padding: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, // 🟢 Réduction de 16 à 12 pour compacter la hauteur
        paddingHorizontal: 20,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceBorder
    },
    rankContainer: {
        width: 32,
        alignItems: 'center',
        marginRight: 12, // Légèrement réduit pour gagner de la place
    },
    labelContainer: {
        flex: 1,
        flexDirection: 'row', // 🟢 Aligne le nom et le badge horizontalement
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingRight: 10, // Laisse un peu d'espace avant les points
    },
    nameText: {
        marginBottom: 0, // 🟢 Suppression de la marge en bas
        marginRight: 8,  // Ajout d'une marge à droite pour séparer du badge
        fontFamily: 'Inter_600SemiBold',
        color: Colors.text,
        fontSize: 15,
        flexShrink: 1, // 🟢 Permet au texte de se couper avec des "..." si besoin
    },
    rewardBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        flexShrink: 0,
    },
    rewardText: {
        fontSize: 10,
        fontFamily: 'Inter_700Bold',
        marginBottom: 0,
    },
    statsContainer: {
        alignItems: 'flex-end',
        minWidth: 50, // Garantit que les points ont toujours assez de place
    },
    pointsText: {
        marginBottom: 0,
        fontFamily: 'Inter_700Bold',
        fontSize: 14,
    },
    sectionSubtitle: {
        fontSize: 12,
        fontFamily: 'Inter_600SemiBold',
        color: Colors.textMuted,
        letterSpacing: 1.2,
    },
});