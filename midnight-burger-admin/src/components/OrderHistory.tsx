// src/components/OrderHistory.tsx
import { collection, onSnapshot, orderBy, query, where, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import type { Order } from '../types';
import { OrderCard } from './OrderCard';

// Fonction utilitaire pour avoir la date du jour au format YYYY-MM-DD
const getTodayString = () => {
    const today = new Date();
    return new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

export default function OrderHistory() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    // 🟢 Nouveaux états pour la période (Date de début et Date de fin)
    const [startDate, setStartDate] = useState(getTodayString());
    const [endDate, setEndDate] = useState(getTodayString());

    useEffect(() => {
        if (!startDate || !endDate) return;

        // 1. Limite basse : Date de début à 00:00:00
        const [startYear, startMonth, startDay] = startDate.split('-');
        const startOfPeriod = new Date(Number(startYear), Number(startMonth) - 1, Number(startDay));
        startOfPeriod.setHours(0, 0, 0, 0);

        // 2. Limite haute : Date de fin à 23:59:59
        const [endYear, endMonth, endDay] = endDate.split('-');
        const endOfPeriod = new Date(Number(endYear), Number(endMonth) - 1, Number(endDay));
        endOfPeriod.setHours(23, 59, 59, 999);

        // 3. Conversion en Timestamp Firebase
        const startTs = Timestamp.fromDate(startOfPeriod);
        const endTs = Timestamp.fromDate(endOfPeriod);

        // 4. Requête ciblée sur la période
        const q = query(
            collection(db, 'orders'),
            where('createdAt', '>=', startTs),
            where('createdAt', '<=', endTs),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders: Order[] = [];
            snapshot.forEach((doc) => {
                fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
            });
            setOrders(fetchedOrders);
        });

        return () => unsubscribe();
    }, [startDate, endDate]); // Se relance si l'une des deux dates change

    // On ne garde que les commandes archivées
    const historyOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

    // Calcul du CA sur la période sélectionnée
    const periodTotal = historyOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + order.totalAmount, 0);

    return (
        <div style={styles.dashboard}>
            <header style={styles.header}>
                <div style={styles.headerTop}>
                    <h2 style={styles.headerTitle}>Historique</h2>

                    {/* 🟢 Sélecteurs de date (Du ... Au ...) */}
                    <div style={styles.dateFilters}>
                        <div style={styles.dateInputGroup}>
                            <span style={styles.dateLabel}>Du</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={styles.datePicker}
                            />
                        </div>
                        <div style={styles.dateInputGroup}>
                            <span style={styles.dateLabel}>Au</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={styles.datePicker}
                            />
                        </div>
                    </div>
                </div>

                <div style={styles.statsRow}>
                    <p style={styles.subtitle}>
                        {historyOrders.length} commande(s) sur la période
                    </p>
                    {periodTotal > 0 && (
                        <p style={styles.revenueBadge}>CA : {periodTotal.toFixed(2)} €</p>
                    )}
                </div>
            </header>

            <div style={styles.content}>
                <div style={styles.orderList}>
                    {historyOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            isExpanded={expandedOrderId === order.id}
                            onToggle={() => setExpandedOrderId(prev => prev === order.id ? null : order.id)}
                        />
                    ))}
                </div>

                {historyOrders.length === 0 && (
                    <div style={styles.emptyState}>
                        <p style={styles.emptyText}>Aucune commande finalisée sur cette période.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    dashboard: { minHeight: '100vh', backgroundColor: '#000', padding: '20px 15px', fontFamily: "'Inter', sans-serif", color: '#FFF' },
    header: { marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #222' },
    headerTop: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' },
    headerTitle: { margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '1px' },

    // Nouveaux styles pour les filtres de date
    dateFilters: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    dateInputGroup: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#111', padding: '4px 12px', borderRadius: '10px', border: '1px solid #333' },
    dateLabel: { fontSize: '13px', color: '#888', fontWeight: 600, textTransform: 'uppercase' },
    datePicker: {
        backgroundColor: 'transparent',
        color: '#FFF',
        border: 'none',
        outline: 'none',
        fontFamily: "'Inter', sans-serif",
        fontSize: '14px',
        colorScheme: 'dark'
    },

    statsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    subtitle: { margin: 0, color: 'rgba(235,235,245,0.5)', fontSize: '14px' },
    revenueBadge: { margin: 0, backgroundColor: 'rgba(50, 215, 75, 0.1)', color: '#32D74B', padding: '6px 12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700 },
    content: { display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '600px', margin: '0 auto' },
    orderList: { display: 'flex', flexDirection: 'column', gap: '0px' },
    emptyState: { textAlign: 'center', padding: '60px 20px' },
    emptyText: { color: '#555', fontSize: '16px', fontWeight: 600 }
};