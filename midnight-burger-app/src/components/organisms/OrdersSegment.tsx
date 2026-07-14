// src/components/organisms/OrdersSegment.tsx
import { Colors } from '@/src/constants/theme';
import { Order } from '@/src/models/Order';
import { feedbackService } from '@/src/services/feedbackService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typography } from '../atoms/Typography';
import { OrderModal } from './OrderModal';

interface OrdersSegmentProps {
    orders: Order[];
}

export const OrdersSegment = ({ orders }: OrdersSegmentProps) => {
    // État pour gérer la modale de détails
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return { label: 'Confirmée', color: Colors.warning, bg: Colors.warning + '26' }; // Orange/Jaune : En attente d'un livreur
            case 'delivering':
                return { label: 'En route', color: Colors.info, bg: Colors.info + '26' }; // Bleu : Le livreur est en chemin
            case 'completed':
                return { label: 'Livrée', color: Colors.success, bg: Colors.success + '26' }; // Vert : Arrivé à destination
            case 'cancelled':
                return { label: 'Annulée', color: Colors.error, bg: Colors.error + '26' }; // Rouge : Commande annulée
            default:
                return { label: status, color: Colors.textMuted, bg: Colors.surfaceLight };
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'À l\'instant';
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    };

    const handleOpenOrder = (order: Order) => {
        feedbackService.light();
        setSelectedOrder(order);
        setIsModalVisible(true);
    };

    return (
        <View style={styles.container}>
            {orders.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} style={{ marginBottom: 16 }} />
                    <Typography variant="body" style={styles.emptyText}>Aucune commande passée pour le moment.</Typography>
                </View>
            ) : (
                orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);

                    // Calcul du nombre total d'articles
                    const totalItems = order.items?.reduce((acc, item: any) => acc + item.quantity, 0) || 0;

                    return (
                        <TouchableOpacity
                            key={order.id}
                            activeOpacity={0.7}
                            onPress={() => handleOpenOrder(order)}
                            style={[
                                styles.orderGlassCard,
                                (order.status === 'completed' || order.status === 'cancelled') && { opacity: 0.6 },
                            ]}
                        >
                            <View style={styles.orderHeaderRow}>
                                <View style={styles.modeBadge}>
                                    <Ionicons name={'bicycle'} size={14} color={Colors.text} />
                                    <Typography variant="body" style={styles.orderMode}>
                                        Livraison
                                    </Typography>
                                </View>
                                <Typography variant="body" style={styles.dateText}>
                                    {formatDate(order.createdAt)}
                                </Typography>
                            </View>

                            <View style={styles.priceRow}>
                                <Typography variant="price" style={styles.priceText}>{order.totalAmount.toFixed(2)} €</Typography>
                                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                                    <Typography variant="body" style={[styles.statusText, { color: statusConfig.color }]}>
                                        {statusConfig.label}
                                    </Typography>
                                </View>
                            </View>

                            {/* Résumé allégé en bas de carte avec icône chevron pour inviter au clic */}
                            <View style={styles.summaryRow}>
                                <Typography variant="body" style={styles.summaryText}>
                                    {totalItems} article{totalItems > 1 ? 's' : ''}
                                </Typography>
                                <View style={styles.detailsAction}>
                                    <Typography variant="body" style={styles.detailsText}>Détails</Typography>
                                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })
            )}

            {/* Modale affichant le détail au clic */}
            <OrderModal
                isVisible={isModalVisible}
                order={selectedOrder}
                onClose={() => setIsModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
    },
    orderGlassCard: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        marginBottom: 16,
    },
    orderHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    orderMode: {
        marginBottom: 0,
        fontSize: 13,
        fontFamily: 'Inter_600SemiBold',
        color: Colors.text,
    },
    dateText: {
        fontSize: 13,
        color: Colors.textMuted,
        marginBottom: 0,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    priceText: {
        fontSize: 22,
        fontFamily: 'Inter_700Bold',
        color: Colors.text,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 13,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 0,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceBorder,
        paddingTop: 14,
    },
    summaryText: {
        marginBottom: 0,
        color: Colors.textMuted,
        fontSize: 14,
    },
    detailsAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailsText: {
        marginBottom: 0,
        color: Colors.textMuted,
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontStyle: 'italic',
        color: Colors.textMuted
    },
});