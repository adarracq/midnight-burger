// src/screens/profile/ProfileScreen.tsx
import { Colors } from '@/src/constants/theme';
import { User as FirebaseAuthUser, deleteUser, onAuthStateChanged, signOut } from 'firebase/auth'; // 🟢 Ajout de deleteUser
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore'; // 🟢 Ajout de deleteDoc, onSnapshot remplace getDoc
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import { Typography } from '../../components/atoms/Typography';
import { AuthForm } from '../../components/organisms/AuthForm';

// Import des sous-composants
import { CustomAlert } from '@/src/components/molecules/CustomAlert';
import { EditProfileModal } from '@/src/components/organisms/EditProfileModal';
import { feedbackService } from '@/src/services/feedbackService';
import { LoyaltySegment } from '../../components/organisms/LoyaltySegment';
import { OrdersSegment } from '../../components/organisms/OrdersSegment';
import { SettingsSegment } from '../../components/organisms/SettingsSegment';

type Tab = 'loyalty' | 'orders' | 'settings';

export const ProfileScreen = () => {
    const [user, setUser] = useState<FirebaseAuthUser | null>(null);
    const [userData, setUserData] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<Tab>('loyalty');
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
        showCancel?: boolean;
        confirmText?: string;
        onConfirm?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    useEffect(() => {
        let unsubscribeOrders: () => void;
        let unsubscribeUser: () => void; // 🟢 Nouvel écouteur pour l'utilisateur

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    // 🟢 NOUVEAU : onSnapshot au lieu de getDoc pour les mises à jour en direct
                    unsubscribeUser = onSnapshot(doc(db, 'users', currentUser.uid), (userDoc) => {
                        if (userDoc.exists()) {
                            setUserData(userDoc.data());
                        }
                    });

                    const ordersQuery = query(
                        collection(db, 'orders'),
                        where('userId', '==', currentUser.uid)
                    );

                    unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
                        const fetchedOrders = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));

                        fetchedOrders.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                        setOrders(fetchedOrders);
                    });

                } catch (error) {
                    console.error("Erreur lors de la récupération des données :", error);
                }
            } else {
                setUserData(null);
                setOrders([]);
                if (unsubscribeOrders) unsubscribeOrders();
                if (unsubscribeUser) unsubscribeUser();
            }
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeOrders) unsubscribeOrders();
            if (unsubscribeUser) unsubscribeUser();
        };
    }, []);

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));
    const showAlert = (config: Omit<typeof alertConfig, 'visible'>) => setAlertConfig({ ...config, visible: true });

    const handleLogout = () => {
        feedbackService.heavy();
        showAlert({
            title: "Déconnexion",
            message: "Veux-tu vraiment te déconnecter ?",
            type: 'warning',
            showCancel: true,
            confirmText: "Déconnexion",
            onConfirm: async () => {
                closeAlert();
                try {
                    await signOut(auth);
                } catch (error) {
                    setTimeout(() => showAlert({
                        title: "Erreur",
                        message: "Impossible de se déconnecter.",
                        type: 'error'
                    }), 500);
                }
            }
        });
    };

    // 🟢 VRAIE FONCTION DE SUPPRESSION DE COMPTE (Obligatoire pour les stores)
    const handleDeleteAccount = () => {
        feedbackService.heavy();
        showAlert({
            title: "Supprimer le compte",
            message: "Cette action est irréversible. Toutes tes commandes et tes points seront perdus. Es-tu sûr ?",
            type: 'error',
            showCancel: true,
            confirmText: "Supprimer",
            onConfirm: async () => {
                closeAlert();
                try {
                    if (user) {
                        // 1. Supprimer les données RGPD
                        await deleteDoc(doc(db, 'users', user.uid));
                        await deleteDoc(doc(db, 'leaderboard', user.uid));

                        // 2. Supprimer l'authentification
                        await deleteUser(user);

                        // Déconnexion gérée automatiquement par onAuthStateChanged
                    }
                } catch (error: any) {
                    console.error(error);
                    // Erreur classique de Firebase : nécessite une connexion récente pour supprimer un compte
                    setTimeout(() => showAlert({
                        title: "Action requise",
                        message: "Pour des raisons de sécurité, veuillez vous déconnecter puis vous reconnecter avant de supprimer votre compte.",
                        type: 'warning'
                    }), 500);
                }
            }
        });
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Typography variant="title" style={styles.centerText}>Mon Espace</Typography>
                    <AuthForm
                        titleLogin="Connecte-toi pour voir tes points et tes commandes"
                        titleRegister="Rejoins le club et suis tes burgers !"
                    />
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Typography variant="title" style={styles.headerTitle}>Mon Espace</Typography>
            </View>

            <View style={styles.segmentContainer}>
                <TouchableOpacity
                    style={[styles.segmentBtn, activeTab === 'loyalty' && styles.segmentBtnActive]}
                    onPress={() => { setActiveTab('loyalty'); feedbackService.light(); }}
                >
                    <Typography variant="body" style={[styles.segmentText, activeTab === 'loyalty' && styles.segmentTextActive]}>Fidélité</Typography>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.segmentBtn, activeTab === 'orders' && styles.segmentBtnActive]}
                    onPress={() => { setActiveTab('orders'); feedbackService.light(); }}
                >
                    <Typography variant="body" style={[styles.segmentText, activeTab === 'orders' && styles.segmentTextActive]}>Commandes</Typography>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.segmentBtn, activeTab === 'settings' && styles.segmentBtnActive]}
                    onPress={() => { setActiveTab('settings'); feedbackService.light(); }}
                >
                    <Typography variant="body" style={[styles.segmentText, activeTab === 'settings' && styles.segmentTextActive]}>Réglages</Typography>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {activeTab === 'loyalty' && <LoyaltySegment userData={userData} />}
                {activeTab === 'orders' && <OrdersSegment orders={orders} />}
                {activeTab === 'settings' && (
                    <SettingsSegment
                        user={user}
                        userData={userData}
                        onLogout={handleLogout}
                        onDeleteAccount={handleDeleteAccount} // 🟢 Appel de la vraie fonction
                        onEditAddress={() => { setIsEditModalVisible(true); feedbackService.light(); }}
                    />
                )}
            </ScrollView>

            {user && (
                <EditProfileModal
                    isVisible={isEditModalVisible}
                    onClose={() => setIsEditModalVisible(false)}
                    userUid={user.uid}
                    userData={userData}
                />
            )}

            <CustomAlert
                isVisible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                showCancel={alertConfig.showCancel}
                confirmText={alertConfig.confirmText || 'Fermer'}
                onClose={closeAlert}
                onConfirm={alertConfig.onConfirm}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
    loader: {
        marginTop: 50
    },
    centerText: {
        textAlign: 'center',
        marginTop: 60,
        marginBottom: 20,
        color: Colors.text
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        marginBottom: 16,
    },
    headerTitle: {
        textAlign: 'left',
    },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        marginHorizontal: 20,
        padding: 4,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        marginBottom: 16,
    },
    segmentBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 16,
    },
    segmentBtnActive: {
        backgroundColor: Colors.surfaceLight,
    },
    segmentText: {
        marginBottom: 0,
        fontSize: 13,
        fontFamily: 'Inter_600SemiBold',
    },
    segmentTextActive: {
        color: Colors.text,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        flexGrow: 1,
    },
});