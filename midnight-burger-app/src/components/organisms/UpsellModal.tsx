// src/components/organisms/UpsellModal.tsx
import { Colors } from '@/src/constants/theme';
import { Product } from '@/src/models/Product';
import { feedbackService } from '@/src/services/feedbackService';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typography } from '../atoms/Typography';
import { BaseBottomSheet } from '../molecules/BaseBottomSheet';

interface UpsellModalProps {
    isVisible: boolean;
    onClose: () => void;
    desserts: Product[];
    onAddDessert: (product: Product) => void;
}

export const UpsellModal = ({ isVisible, onClose, desserts, onAddDessert }: UpsellModalProps) => {

    const handleSkip = () => {
        feedbackService.light();
        onClose();
    };

    const handleAdd = (item: Product) => {
        feedbackService.heavy(); // Petite vibration sympa quand on craque pour un dessert
        onAddDessert(item);
        onClose();
    };

    return (
        <BaseBottomSheet isVisible={isVisible} title="Une petite douceur ?" onClose={onClose}>
            <View style={styles.container}>
                <Typography variant="body" style={styles.subtitle}>
                    Ajoute un dessert à ta commande de nuit pour finir en beauté !
                </Typography>

                <FlatList
                    data={desserts}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.card}
                            activeOpacity={0.7}
                            onPress={() => handleAdd(item)}
                        >
                            {item.imageUrl ? (
                                <Image source={{ uri: item.imageUrl }} style={styles.image} />
                            ) : (
                                <View style={styles.placeholderImage} />
                            )}

                            <View style={styles.cardContent}>
                                <Typography variant="subtitle" style={styles.name} numberOfLines={2}>
                                    {item.name}
                                </Typography>
                                <Typography variant="price" style={styles.price}>
                                    {item.price.toFixed(2)} €
                                </Typography>
                            </View>

                            <View style={styles.addBtn}>
                                <Plus size={20} color="#000000" strokeWidth={2.5} />
                            </View>
                        </TouchableOpacity>
                    )}
                />

                <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                    <Typography variant="body" style={styles.skipText}>Non merci.</Typography>
                </TouchableOpacity>
            </View>
        </BaseBottomSheet>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    subtitle: {
        color: Colors.textMuted,
        fontSize: 15,
        marginBottom: 24,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    list: {
        gap: 16, // Espace généreux entre chaque dessert
        paddingBottom: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        borderRadius: 24,
        padding: 12,
    },
    image: {
        width: 72,
        height: 72,
        borderRadius: 16,
        backgroundColor: Colors.surfaceLight
    },
    placeholderImage: {
        width: 72,
        height: 72,
        borderRadius: 16,
        backgroundColor: Colors.surfaceLight
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        marginBottom: 6,
        color: Colors.text,
    },
    price: {
        fontSize: 16,
        color: Colors.primary,
        marginBottom: 0,
    },
    addBtn: {
        backgroundColor: Colors.primary,
        width: 44,
        height: 44,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    skipBtn: {
        marginTop: 10,
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        backgroundColor: 'transparent',
    },
    skipText: {
        color: Colors.textMuted,
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 0,
    }
});