// src/components/OrdersBoard.tsx
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import type { Order } from '../types';
import { OrderCard } from './OrderCard'; // 🟢 Import du nouveau composant
import { DeliveryMap } from './DeliveryMap';

interface OrdersBoardProps {
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

export default function OrdersBoard({ audioRef }: OrdersBoardProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders: Order[] = [];

            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    if (data.status === 'pending') {
                        audioRef.current?.play().catch(e => console.log("Erreur audio", e));
                    }
                }
            });

            snapshot.forEach((doc) => {
                fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
            });

            setOrders(fetchedOrders);
        });

        return () => unsubscribe();
    }, [audioRef]);

    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

    // Regroupement par ville
    const groupedByCity = activeOrders.reduce((acc, order) => {
        const city = order.deliveryAddress?.city || 'Inconnu';
        if (!acc[city]) acc[city] = [];
        acc[city].push(order);
        return acc;
    }, {} as Record<string, Order[]>);

    const cities = Object.keys(groupedByCity).sort();

    return (
        <div style={styles.dashboard}>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                    * { box-sizing: border-box; }
                `}
            </style>

            <header style={styles.header}>
                <h2 style={styles.headerTitle}>COURSES ({activeOrders.length})</h2>
            </header>

            <div style={styles.content}>
                {cities.map(city => (
                    <div key={city} style={styles.citySection}>
                        <h3 style={styles.cityTitle}>
                            {city}
                            <span style={styles.cityCount}>{groupedByCity[city].length}</span>
                        </h3>

                        <div style={styles.orderList}>
                            {groupedByCity[city].map((order) => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    isExpanded={expandedOrderId === order.id}
                                    onToggle={() => setExpandedOrderId(prev => prev === order.id ? null : order.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {activeOrders.length === 0 && (
                    <div style={styles.emptyState}>
                        <p style={styles.emptyText}>Aucune course en attente.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    dashboard: {
        minHeight: '100vh',
        backgroundColor: '#000', // Noir complet
        padding: '20px 15px',
        fontFamily: "'Inter', sans-serif",
        color: '#FFF'
    },
    header: {
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #222'
    },
    headerTitle: {
        margin: 0,
        fontSize: '22px',
        fontWeight: 800,
        letterSpacing: '1px'
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        maxWidth: '600px',
        margin: '0 auto'
    },
    citySection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    cityTitle: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 700,
        color: '#AAA',
        textTransform: 'uppercase',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '8px',
        borderBottom: '1px solid #222'
    },
    cityCount: {
        color: '#000',
        backgroundColor: '#FFF',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: 800
    },
    orderList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0px' // L'espacement est géré par la marge des cartes
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 20px'
    },
    emptyText: {
        color: '#555',
        fontSize: '16px',
        fontWeight: 600
    }
};