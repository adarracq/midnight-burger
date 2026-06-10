// src/components/OrdersBoard.tsx
import { collection, doc, onSnapshot, orderBy, query, updateDoc, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import type { Order } from '../types';
import { IoReceipt, IoNavigate } from 'react-icons/io5';

interface OrdersBoardProps {
    audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

export default function OrdersBoard({ audioRef }: OrdersBoardProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    // 🟢 Nouveaux états pour gérer l'annulation en direct
    const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');

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

    const updateOrderStatus = async (orderId: string, newStatus: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const updateData: any = { status: newStatus };

            if (newStatus === 'delivering') updateData.deliveringAt = serverTimestamp();
            if (newStatus === 'completed') updateData.completedAt = serverTimestamp();

            await updateDoc(doc(db, 'orders', orderId), updateData);

            if (newStatus === 'completed') {
                setExpandedOrderId(null);
            }
        } catch (error) {
            console.error("Erreur mise à jour statut :", error);
        }
    };

    // 🟢 Fonction dédiée à l'annulation
    const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!cancelReason.trim()) {
            alert("Veuillez indiquer une raison pour l'annulation.");
            return;
        }

        try {
            await updateDoc(doc(db, 'orders', orderId), {
                status: 'cancelled',
                canceledAt: serverTimestamp(),
                cancellationReason: cancelReason.trim()
            });

            // On nettoie les états après l'annulation
            setCancelingOrderId(null);
            setCancelReason('');
            setExpandedOrderId(null);
        } catch (error) {
            console.error("Erreur lors de l'annulation :", error);
        }
    };

    const toggleExpand = (orderId: string) => {
        // Si on ferme la carte, on réinitialise l'état d'annulation en cours
        if (expandedOrderId === orderId) {
            setCancelingOrderId(null);
            setCancelReason('');
        }
        setExpandedOrderId(prev => prev === orderId ? null : orderId);
    };

    const formatDateTime = (timestamp: any) => {
        if (!timestamp) return '...';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(',', ' -');
    };

    const formatTimeOnly = (timestamp: any) => {
        if (!timestamp) return '...';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

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
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                    
                    @keyframes pulseGlow {
                        0% { border-left-color: rgba(93, 138, 205, 0.4); }
                        50% { border-left-color: rgba(93, 138, 205, 1); }
                        100% { border-left-color: rgba(93, 138, 205, 0.4); }
                    }

                    .glass-button {
                        transition: all 0.2s ease;
                    }
                    .glass-button:active {
                        transform: scale(0.98);
                    }
                    
                    .glass-input:focus {
                        outline: none;
                        border-color: #FF453A;
                        box-shadow: 0 0 0 3px rgba(255, 69, 58, 0.2);
                    }
                `}
            </style>

            <header style={styles.header}>
                <h2 style={styles.headerTitle}>Courses disponibles ({activeOrders.length})</h2>
            </header>

            <div style={styles.content}>
                {cities.map(city => (
                    <div key={city} style={styles.citySection}>
                        <h3 style={styles.cityTitle}>{city} <span style={styles.cityCount}>{groupedByCity[city].length}</span></h3>

                        <div style={styles.orderList}>
                            {groupedByCity[city].map((order) => {
                                const isExpanded = expandedOrderId === order.id;
                                const isPending = order.status === 'pending';
                                const isCanceling = cancelingOrderId === order.id;

                                return (
                                    <div
                                        key={order.id}
                                        style={{
                                            ...styles.card,
                                            ...(isPending ? styles.cardPending : styles.cardDelivering)
                                        }}
                                        onClick={() => toggleExpand(order.id)}
                                    >
                                        <div style={styles.compactRow}>
                                            <div style={styles.compactLeft}>
                                                <span style={styles.timeText}>{formatDateTime(order.createdAt)}</span>
                                                <span style={styles.streetText}>{order.deliveryAddress?.street}</span>
                                            </div>
                                            <div style={styles.compactRight}>
                                                <span style={styles.priceText}>{order.totalAmount.toFixed(2)} €</span>
                                                <span style={isPending ? styles.badgePending : styles.badgeDelivering}>
                                                    {isPending ? 'À prendre' : 'En cours'}
                                                </span>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div style={styles.expandedContent}>

                                                <div style={styles.contactBox}>
                                                    {order.deliveryAddress?.details && (
                                                        <span style={styles.detailsText}>{order.deliveryAddress.details}</span>
                                                    )}
                                                    {order.phone && (
                                                        <a href={`tel:${order.phone}`} onClick={(e) => e.stopPropagation()} style={styles.phoneLink}>
                                                            Appeler le client : {order.phone}
                                                        </a>
                                                    )}
                                                </div>

                                                <div style={styles.itemsBox}>
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} style={styles.itemLine}>
                                                            <strong style={styles.itemQty}>{item.quantity}x</strong> {item.name}
                                                            {item.note && <span style={styles.itemNote}>({item.note})</span>}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div style={styles.timelineBox}>
                                                    <div style={styles.timelineItem}>
                                                        <IoReceipt size={16} color={'#F5E134'} />
                                                        <span style={styles.timelineText}>Commande passée à <strong style={{ color: '#F5E134' }}>{formatTimeOnly(order.createdAt)}</strong></span>
                                                    </div>
                                                    {order.deliveringAt && (
                                                        <div style={styles.timelineItem}>
                                                            <IoNavigate size={16} color={'#5D8ACD'} />
                                                            <span style={styles.timelineText}>Course acceptée à <strong style={{ color: '#5D8ACD' }}>{formatTimeOnly(order.deliveringAt)}</strong></span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 🟢 Bloc Actions ou Bloc Annulation */}
                                                {isCanceling ? (
                                                    <div style={styles.cancelBox} onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            className="glass-input"
                                                            style={styles.cancelInput}
                                                            placeholder="Raison de l'annulation (ex: Client injoignable)..."
                                                            value={cancelReason}
                                                            onChange={(e) => setCancelReason(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <div style={styles.cancelActionsRow}>
                                                            <button
                                                                className="glass-button"
                                                                style={styles.btnCancelConfirm}
                                                                onClick={(e) => handleCancelOrder(order.id, e)}
                                                            >
                                                                Confirmer
                                                            </button>
                                                            <button
                                                                className="glass-button"
                                                                style={styles.btnCancelAbort}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCancelingOrderId(null);
                                                                    setCancelReason('');
                                                                }}
                                                            >
                                                                Retour
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={styles.actionsBox}>
                                                        {isPending ? (
                                                            <button
                                                                className="glass-button"
                                                                style={styles.btnAccept}
                                                                onClick={(e) => updateOrderStatus(order.id, 'delivering', e)}
                                                            >
                                                                Accepter la course
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="glass-button"
                                                                style={styles.btnComplete}
                                                                onClick={(e) => updateOrderStatus(order.id, 'completed', e)}
                                                            >
                                                                Livraison effectuée
                                                            </button>
                                                        )}

                                                        <button
                                                            className="glass-button"
                                                            style={styles.btnCancelInit}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCancelingOrderId(order.id);
                                                            }}
                                                        >
                                                            Annuler la commande
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
    dashboard: { minHeight: '100vh', backgroundColor: '#000000', padding: '20px 15px', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: '#FFFFFF' },
    header: { marginBottom: '24px', paddingBottom: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
    headerTitle: { margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' },
    content: { display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '600px', margin: '0 auto' },
    citySection: { display: 'flex', flexDirection: 'column', gap: '12px' },
    cityTitle: { margin: 0, fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
    cityCount: { color: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' },
    orderList: { display: 'flex', flexDirection: 'column', gap: '8px' },

    card: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', borderLeft: '4px solid transparent', cursor: 'pointer', overflow: 'hidden' },
    cardPending: { borderLeftColor: '#5D8ACD', animation: 'pulseGlow 2s infinite' },
    cardDelivering: { borderLeftColor: '#4E8A75' },
    compactRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' },
    compactLeft: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, marginRight: '10px' },
    timeText: { fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 },
    streetText: { fontSize: '16px', fontWeight: 600, color: '#FFFFFF' },
    compactRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
    priceText: { fontSize: '15px', fontWeight: 700 },
    badgePending: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(93, 138, 205, 0.2)', color: '#5D8ACD', padding: '4px 8px', borderRadius: '6px' },
    badgeDelivering: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(78, 138, 117, 0.2)', color: '#4E8A75', padding: '4px 8px', borderRadius: '6px' },

    expandedContent: { padding: '0 16px 16px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '8px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' },
    contactBox: { display: 'flex', flexDirection: 'column', gap: '8px' },
    detailsText: { fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic' },
    phoneLink: { fontSize: '15px', fontWeight: 600, color: '#F5E134', textDecoration: 'none', display: 'block', backgroundColor: 'rgba(245, 225, 52, 0.1)', padding: '10px 12px', borderRadius: '8px', textAlign: 'center' },
    itemsBox: { backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' },
    itemLine: { marginBottom: '4px' },
    itemQty: { color: '#F5E134', marginRight: '6px' },
    itemNote: { color: 'rgba(255, 255, 255, 0.5)', marginLeft: '6px', fontStyle: 'italic' },

    timelineBox: { backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
    timelineItem: { display: 'flex', alignItems: 'center', gap: '10px' },
    timelineText: { fontSize: '13px', color: 'rgba(235, 235, 245, 0.7)', fontWeight: 400 },

    // --- Actions ---
    actionsBox: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' },
    btnAccept: { width: '100%', backgroundColor: '#5D8ACD', color: '#FFF', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer' },
    btnComplete: { width: '100%', backgroundColor: '#4E8A75', color: '#FFF', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer' },
    btnCancelInit: { width: '100%', backgroundColor: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', border: '1px solid rgba(255, 69, 58, 0.3)', padding: '12px', borderRadius: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },

    // --- Formulaire d'Annulation ---
    cancelBox: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px', backgroundColor: 'rgba(255, 69, 58, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 69, 58, 0.2)' },
    cancelInput: { padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 69, 58, 0.4)', backgroundColor: 'rgba(0, 0, 0, 0.2)', color: '#FFF', fontSize: '14px', fontFamily: "'Inter', sans-serif" },
    cancelActionsRow: { display: 'flex', gap: '10px' },
    btnCancelConfirm: { flex: 2, backgroundColor: '#FF453A', color: '#FFF', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' },
    btnCancelAbort: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '14px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },

    emptyState: { textAlign: 'center', padding: '40px 20px' },
    emptyText: { color: 'rgba(255, 255, 255, 0.3)', fontSize: '15px' }
};