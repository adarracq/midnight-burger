// src/components/DeliveryMap.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { Order } from '../types';
import { OrderCard } from './OrderCard';

const mapContainerStyle = {
    width: '100%',
    height: '100%', // 🟢 Fini le calc() hasardeux !
};

const defaultCenter = {
    lat: 44.7937,
    lng: -1.1492
};

export const DeliveryMap = () => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const [orders, setOrders] = useState<Order[]>([]);
    
    // 🟢 CORRECTION : On sauvegarde l'ID au lieu de l'objet complet
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const q = query(collection(db, 'orders'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders: Order[] = [];
            snapshot.forEach((doc) => {
                fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
            });
            setOrders(fetchedOrders);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const activeOrders = useMemo(() => {
        return orders.filter(o => 
            (o.status === 'pending' || o.status === 'delivering') && 
            o.deliveryAddress?.lat && 
            o.deliveryAddress?.lng
        );
    }, [orders]);

    // 🟢 On déduit la commande sélectionnée avec les données fraîches en temps réel
    const selectedOrder = activeOrders.find(o => o.id === selectedOrderId) || null;

    // 🟢 Si la commande est terminée/annulée (n'est plus dans activeOrders), on ferme la popup
    useEffect(() => {
        if (isOrderModalOpen && selectedOrderId && !selectedOrder) {
            setIsOrderModalOpen(false);
            setSelectedOrderId(null);
        }
    }, [activeOrders, isOrderModalOpen, selectedOrderId, selectedOrder]);

    const getElapsedMinutes = (timestamp: any) => {
        if (!timestamp) return 0;
        const orderDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffMs = now.getTime() - orderDate.getTime();
        return Math.floor(diffMs / 60000);
    };

    const getMarkerIcon = (status: string, elapsedMins: number) => {
        if (status === 'delivering') return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
        if (elapsedMins >= 30) return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
        return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    };

    if (loadError) return <div style={{ color: '#FF453A', padding: '20px' }}>Erreur de chargement de la carte</div>;
    if (!isLoaded) return <div style={{ color: '#FFF', padding: '20px' }}>Chargement de la carte GPS...</div>;

    return (
        <div style={{ position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <style>
                {`
                    .custom-marker-label {
                        background-color: rgba(255, 255, 255, 0.95);
                        color: #000000 !important;
                        font-weight: 800 !important;
                        font-size: 13px !important;
                        font-family: 'Inter', sans-serif;
                        padding: 4px 8px;
                        border-radius: 8px;
                        border: 2px solid #000;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
                        transform: translateY(-28px);
                        white-space: nowrap;
                    }
                    /* 🟢 L'étiquette passe en vert si la livraison est en cours */
                    .label-delivering {
                        border-color: #4E8A75;
                        color: #4E8A75 !important;
                    }
                `}
            </style>

            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={12}
                center={activeOrders.length > 0 
                    ? { lat: activeOrders[0].deliveryAddress!.lat, lng: activeOrders[0].deliveryAddress!.lng } 
                    : defaultCenter
                }
                options={{
                    styles: darkModeStyles,
                    disableDefaultUI: true,
                    zoomControl: true,
                }}
            >
                {activeOrders.map(order => {
                    const elapsed = getElapsedMinutes(order.createdAt);
                    const lat = order.deliveryAddress!.lat;
                    const lng = order.deliveryAddress!.lng;
                    
                    // 🟢 NOUVEAU : Ajout du petit icône vélo + changement de style selon l'état
                    const isDelivering = order.status === 'delivering';
                    const labelText = isDelivering ? `${elapsed} min 🚲` : `${elapsed} min`;

                    return (
                        <Marker
                            key={order.id}
                            position={{ lat, lng }}
                            icon={{ url: getMarkerIcon(order.status, elapsed) }}
                            label={{
                                text: labelText,
                                className: `custom-marker-label ${isDelivering ? 'label-delivering' : ''}`
                            }}
                            onClick={() => {
                                setSelectedOrderId(order.id);
                                setIsOrderModalOpen(true);
                            }}
                        />
                    );
                })}
            </GoogleMap>

            {isOrderModalOpen && selectedOrder && (
                <div style={styles.modalOverlay} onClick={() => {
                    setIsOrderModalOpen(false);
                    setSelectedOrderId(null);
                }}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <OrderCard 
                            order={selectedOrder} 
                            isExpanded={true} 
                            onToggle={() => {}} 
                        />
                        <button 
                            style={styles.btnCloseModal}
                            onClick={() => {
                                setIsOrderModalOpen(false);
                                setSelectedOrderId(null);
                            }}
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    },
    modalContent: {
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: '90vh',
        overflowY: 'auto'
    },
    btnCloseModal: {
        backgroundColor: '#222',
        color: '#FFF',
        border: '1px solid #444',
        padding: '16px',
        borderRadius: '12px',
        fontWeight: 'bold',
        fontSize: '16px',
        cursor: 'pointer'
    }
};

const darkModeStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];