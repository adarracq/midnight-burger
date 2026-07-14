// src/components/OrderCard.tsx
import { serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import React, { useState } from 'react';
import { FaLocationDot, FaPhone, FaUser, FaShareNodes, FaMessage } from 'react-icons/fa6';
import { db } from '../firebaseConfig';
import type { Order } from '../types';

interface OrderCardProps {
    order: Order;
    isExpanded: boolean;
    onToggle: () => void;
}

export const OrderCard = ({ order, isExpanded, onToggle }: OrderCardProps) => {
    const [isCanceling, setIsCanceling] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [copied, setCopied] = useState(false); // État pour le feedback visuel du partage

    // Gestion des statuts
    const isPending = order.status === 'pending';
    const isDelivering = order.status === 'delivering';
    const isCompleted = order.status === 'completed';
    const isCancelled = order.status === 'cancelled';

    let badgeText = 'EN ATTENTE';
    let badgeBg = '#FFF';
    let badgeColor = '#000';
    let borderColor = '#333';

    if (isDelivering) { badgeText = 'EN COURS'; badgeBg = '#4E8A75'; badgeColor = '#FFF'; borderColor = '#4E8A75'; }
    else if (isCompleted) { badgeText = 'LIVRÉE'; badgeBg = '#32D74B'; badgeColor = '#000'; borderColor = '#222'; }
    else if (isCancelled) { badgeText = 'ANNULÉE'; badgeBg = '#FF453A'; badgeColor = '#FFF'; borderColor = '#222'; }

    const clientName = [order.firstName, order.lastName].filter(Boolean).join(' ');
    const displayName = order.pseudo ? `${clientName} "${order.pseudo}"` : clientName || 'Client';

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '--:--';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const updateStatus = async (newStatus: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const updateData: any = { status: newStatus };
            if (newStatus === 'delivering') updateData.deliveringAt = serverTimestamp();
            if (newStatus === 'completed') updateData.completedAt = serverTimestamp();
            await updateDoc(doc(db, 'orders', order.id), updateData);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancel = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!cancelReason.trim()) return alert("Raison requise.");
        try {
            await updateDoc(doc(db, 'orders', order.id), {
                status: 'cancelled',
                canceledAt: serverTimestamp(),
                cancellationReason: cancelReason.trim()
            });
            setIsCanceling(false);
        } catch (error) {
            console.error(error);
        }
    };

    const fullAddress = order.deliveryAddress ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : '';
    const mapsUrl = `http://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;

    // Fonction de partage (Copie dans le presse-papier)
    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const textToShare = `🍔 Commande ${displayName}\n📍 ${fullAddress}\n📞 ${order.phone || 'Non renseigné'}\n💰 ${order.totalAmount.toFixed(2)} €\n🛒 ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}`;
        
        try {
            await navigator.clipboard.writeText(textToShare);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Erreur lors de la copie', err);
            alert("Impossible de copier la commande.");
        }
    };

    // Fonction d'envoi de SMS rapide
    const sendSMS = (message: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!order.phone) {
            alert("Aucun numéro de téléphone renseigné pour ce client.");
            return;
        }
        const smsUrl = `sms:${order.phone}?body=${encodeURIComponent(message)}`;
        window.location.href = smsUrl;
    };

    // Les messages prédéfinis
    const quickMessages = [
        { label: "Je suis là", text: "Je suis là." },
        { label: "J'arrive (2 min)", text: "J'arrive dans 2 minutes, tu peux sortir." },
        { label: "Suivant (5 min)", text: "Tu es le prochain, encore 5 minutes et c'est bon." },
        { label: "Bloqué (15 min)", text: "Je suis bloqué, pas possible avant 15 minutes." },
        { label: "Dans le jus (30 min)", text: "On est dans le jus, il y a environ une demi-heure d'attente. Tu confirmes ta commande ?" }
    ];

    return (
        <div style={{ ...styles.card, borderColor, opacity: (isCompleted || isCancelled) ? 0.7 : 1 }} onClick={() => {
            if (isCanceling) setIsCanceling(false);
            onToggle();
        }}>
            <div style={styles.headerRow}>
                <div style={styles.headerLeft}>
                    <span style={styles.time}>{formatTime(order.createdAt)}</span>
                    <div style={styles.identity}>
                        <FaUser size={12} color="#888" />
                        <span style={{ ...styles.name, color: isCancelled ? '#FF453A' : '#FFF', fontWeight: 600 }}>
                            {isCancelled ? `(Annulée) ${displayName}` : displayName}
                        </span>
                    </div>
                    <div style={styles.identity}>
                        <FaLocationDot size={12} color="#888" />
                        <span style={styles.street}>{order.deliveryAddress?.street}</span>
                    </div>
                </div>

                <div style={styles.headerRight}>
                    <span style={{ ...styles.price, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                        {order.totalAmount.toFixed(2)} €
                    </span>
                    <span style={{ ...styles.statusBadge, backgroundColor: badgeBg, color: badgeColor }}>
                        {badgeText}
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div style={styles.expandedContent} onClick={(e) => e.stopPropagation()}>

                    {order.deliveryAddress?.details && (
                        <div style={styles.infoBlock}>
                            <strong style={styles.infoLabel}>Note Client :</strong>
                            <span style={styles.infoText}>{order.deliveryAddress.details}</span>
                        </div>
                    )}

                    {isCancelled && order.cancellationReason && (
                        <div style={{ ...styles.infoBlock, borderLeftColor: '#FF453A', backgroundColor: 'rgba(255,69,58,0.1)' }}>
                            <strong style={styles.infoLabel}>Raison de l'annulation :</strong>
                            <span style={{ color: '#FF453A', fontWeight: 600 }}>{order.cancellationReason}</span>
                        </div>
                    )}

                    <div style={styles.itemsList}>
                        {order.items.map((item, idx) => (
                            <div key={idx} style={styles.itemRow}>
                                <span style={styles.itemQty}>{item.quantity}</span>
                                <span style={styles.itemName}>
                                    {item.name} {item.note && <span style={styles.itemNote}>({item.note})</span>}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={styles.utilityRow}>
                        {order.phone && (
                            <a href={`tel:${order.phone}`} style={styles.btnUtility}>
                                <FaPhone size={16} /> Appeler
                            </a>
                        )}
                        {order.deliveryAddress && (
                            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={styles.btnUtility}>
                                <FaLocationDot size={16} /> GPS
                            </a>
                        )}
                        <button style={styles.btnUtility} onClick={handleShare}>
                            <FaShareNodes size={16} /> {copied ? "Copié !" : "Partager"}
                        </button>
                    </div>

                    {/* BLOC SMS RAPIDES */}
                    {order.phone && !isCompleted && !isCancelled && (
                        <div style={styles.smsBox}>
                            <strong style={styles.infoLabel}><FaMessage size={12} /> SMS Rapides</strong>
                            <div style={styles.smsGrid}>
                                {quickMessages.map((msg, idx) => (
                                    <button 
                                        key={idx} 
                                        style={styles.btnSms} 
                                        onClick={(e) => sendSMS(msg.text, e)}
                                    >
                                        {msg.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isCompleted && !isCancelled && (
                        isCanceling ? (
                            <div style={styles.cancelBox}>
                                <input
                                    style={styles.cancelInput}
                                    placeholder="Raison de l'annulation..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    autoFocus
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button style={styles.btnDanger} onClick={handleCancel}>Confirmer</button>
                                    <button style={styles.btnSecondary} onClick={() => setIsCanceling(false)}>Retour</button>
                                </div>
                            </div>
                        ) : (
                            <div style={styles.actionBox}>
                                {isPending ? (
                                    <button style={styles.btnPrimary} onClick={(e) => updateStatus('delivering', e)}>
                                        PRENDRE LA COURSE
                                    </button>
                                ) : (
                                    <button style={styles.btnSuccess} onClick={(e) => updateStatus('completed', e)}>
                                        TERMINER LA LIVRAISON
                                    </button>
                                )}
                                <button style={styles.btnCancelInit} onClick={() => setIsCanceling(true)}>
                                    Annuler la commande
                                </button>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    card: { backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', marginBottom: '12px', cursor: 'pointer', overflow: 'hidden' },

    headerRow: { display: 'flex', justifyContent: 'space-between', padding: '16px' },
    headerLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },
    time: { color: '#888', fontSize: '14px', fontWeight: 600 },
    identity: { display: 'flex', alignItems: 'center', gap: '6px', color: '#DDD' },
    name: { fontSize: '15px', fontWeight: 600, color: '#FFF' },
    street: { fontSize: '16px', fontWeight: 700, color: '#FFF', marginTop: '4px' },

    headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' },
    price: { fontSize: '18px', fontWeight: 800, color: '#FFF' },
    statusBadge: { fontSize: '11px', fontWeight: 800, padding: '6px 10px', borderRadius: '4px', letterSpacing: '0.5px' },

    expandedContent: { padding: '0 16px 16px 16px', borderTop: '1px solid #222', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' },

    infoBlock: { backgroundColor: '#1A1A1A', padding: '12px', borderRadius: '8px', borderLeft: '3px solid #FFF' },
    infoLabel: { display: 'block', color: '#888', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px' },
    infoText: { color: '#FFF', fontSize: '15px' },

    itemsList: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' },
    itemRow: { display: 'flex', alignItems: 'flex-start', gap: '12px' },
    itemQty: { backgroundColor: '#333', color: '#FFF', fontSize: '14px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', minWidth: '24px', textAlign: 'center' },
    itemName: { color: '#DDD', fontSize: '15px', lineHeight: '1.4' },
    itemNote: { color: '#888', fontStyle: 'italic', fontSize: '13px' },

    utilityRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    btnUtility: { flex: 1, minWidth: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', backgroundColor: '#222', color: '#FFF', textDecoration: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', border: '1px solid #333', cursor: 'pointer' },

    smsBox: { backgroundColor: '#161616', padding: '12px', borderRadius: '8px', border: '1px solid #222' },
    smsGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    btnSms: { backgroundColor: '#2A2A2A', color: '#DDD', border: '1px solid #444', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 },

    actionBox: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' },
    btnPrimary: { backgroundColor: '#FFF', color: '#000', border: 'none', padding: '18px', borderRadius: '8px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' },
    btnSuccess: { backgroundColor: '#4E8A75', color: '#FFF', border: 'none', padding: '18px', borderRadius: '8px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' },
    btnCancelInit: { backgroundColor: 'transparent', color: '#FF453A', border: 'none', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' },

    cancelBox: { backgroundColor: '#2A1111', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' },
    cancelInput: { padding: '14px', backgroundColor: '#000', border: '1px solid #FF453A', color: '#FFF', borderRadius: '6px', fontSize: '15px' },
    btnDanger: { flex: 2, backgroundColor: '#FF453A', color: '#FFF', border: 'none', padding: '14px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' },
    btnSecondary: { flex: 1, backgroundColor: '#333', color: '#FFF', border: 'none', padding: '14px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' },
};