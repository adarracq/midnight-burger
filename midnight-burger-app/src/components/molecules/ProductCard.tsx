// src/components/organisms/ProductCard.tsx
import { Colors } from '@/src/constants/theme';
import { feedbackService } from '@/src/services/feedbackService';
import { Minus, Plus } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Product } from '../../models/Product';
import { Typography } from '../atoms/Typography';

interface ProductCardProps {
    product: Product;
    quantityInCart: number;
    onAdd: () => void;
    onRemove: () => void;
    onPressCard: () => void;
}

export const ProductCard = ({ product, quantityInCart, onAdd, onRemove, onPressCard }: ProductCardProps) => {
    const isOutOfStock = product.available === false;

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPressCard}
            style={[styles.glassCardContainer, isOutOfStock && styles.unavailableCard]}
        >
            {product.imageUrl && (
                <View style={styles.imageWrapper}>
                    <Image
                        source={{ uri: product.imageUrl }}
                        style={[styles.image, isOutOfStock && styles.unavailableImage]}
                    />
                </View>
            )}

            <View style={styles.infoContainer}>
                <View style={styles.textBlock}>
                    <Typography variant="subtitle" style={styles.title} numberOfLines={1}>
                        {product.name}
                    </Typography>

                    <Typography variant="body" style={styles.description} numberOfLines={2}>
                        {product.description}
                    </Typography>
                </View>

                <View style={styles.actionRow}>

                    <Typography variant="price" style={isOutOfStock ? styles.unavailableText : {}}>
                        {product.category === 'menu' ? 'À partir de ' : ''} {product.price.toFixed(2)} €
                    </Typography>

                    {/* 🟢 Gestion intelligente des boutons */}
                    {!isOutOfStock ? (
                        quantityInCart > 0 ? (
                            <View style={styles.stepperContainer}>
                                <TouchableOpacity style={styles.stepperBtn} onPress={onRemove}>
                                    <Minus size={14} color={Colors.text} />
                                </TouchableOpacity>

                                <Typography variant="body" style={styles.stepperValue}>
                                    {quantityInCart}
                                </Typography>

                                <TouchableOpacity style={styles.stepperBtn} onPress={onAdd}>
                                    <Plus size={14} color={Colors.text} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addBtn} onPress={() => { onAdd(); feedbackService.light(); }}>
                                <Plus color={Colors.text} size={16} />
                            </TouchableOpacity>
                        )
                    ) : (
                        <View style={styles.outOfStockBadge}>
                            <Typography variant="body" style={styles.outOfStockText}>
                                En rupture
                            </Typography>
                        </View>
                    )}
                </View>
            </View>

        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    glassCardContainer: {
        flexDirection: 'row',
        minHeight: 120,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        padding: 14,
        borderColor: Colors.surfaceBorder,
        backgroundColor: Colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    unavailableCard: {
        opacity: 0.6,
    },
    imageWrapper: {
        width: 90,
        height: 90,
        borderRadius: 20,
        backgroundColor: Colors.surfaceLight,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    unavailableImage: {
        opacity: 0.5,
    },
    infoContainer: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'space-between',
    },
    textBlock: {
        flex: 1,
    },
    title: {
        marginBottom: 4,
        fontSize: 16,
    },
    description: {
        fontSize: 13,
        lineHeight: 18,
        color: Colors.textMuted,
        marginBottom: 8,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    unavailableText: {
        color: Colors.textMuted,
    },
    outOfStockBadge: {
        backgroundColor: Colors.surfaceLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    outOfStockText: {
        color: Colors.textMuted,
        fontSize: 12,
        fontFamily: 'Inter_600SemiBold',
        marginBottom: 0,
    },
    // 🟢 Nouveaux styles pour le compteur
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    stepperBtn: {
        padding: 10,
        backgroundColor: Colors.surface,
        borderRadius: 14,
    },
    addBtn: {
        padding: 14,
        backgroundColor: Colors.surface,
        borderRadius: 20,
    },
    stepperValue: {
        marginHorizontal: 12,
        marginBottom: 0,
        fontSize: 14,
        fontFamily: 'Inter_700Bold',
        color: Colors.text,
    }
});