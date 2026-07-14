// src/components/organisms/ProductModal.tsx
import { Colors } from '@/src/constants/theme';
import { Product } from '@/src/models/Product';
import { feedbackService } from '@/src/services/feedbackService';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button } from '../atoms/Button';
import { Typography } from '../atoms/Typography';
import { BaseBottomSheet } from '../molecules/BaseBottomSheet';

interface ProductModalProps {
    isVisible: boolean;
    product: Product | null;
    allProducts: Product[];
    onClose: () => void;
    onAddToCart: (product: Product, quantity: number, note: string) => void;
}

export const ProductModal = ({ isVisible, product, allProducts, onClose, onAddToCart }: ProductModalProps) => {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');

    const [selectedBurger, setSelectedBurger] = useState<Product | null>(null);
    const [selectedDrink, setSelectedDrink] = useState<Product | null>(null);
    const [selectedDessert, setSelectedDessert] = useState<Product | null>(null);

    useEffect(() => {
        setQuantity(1);
        setNote('');
        setSelectedBurger(null);
        setSelectedDrink(null);
        setSelectedDessert(null);
    }, [product, isVisible]);

    if (!product) return null;

    const isMenu = product.category === 'menu';
    const menuType = (product as any).menuType || 'classic'; // 'classic' ou 'maxi'

    const burgers = allProducts.filter(p => p.category === 'burger' && p.available !== false);
    const drinks = allProducts.filter(p => p.category === 'drink' && p.available !== false);
    const desserts = allProducts.filter(p => p.category === 'dessert' && p.available !== false);

    // 🟢 DÉTERMINER LE PRIX DE BASE (LE MOINS CHER) POUR CHAQUE CATÉGORIE
    const minBurgerPrice = burgers.length > 0 ? Math.min(...burgers.map(b => b.price)) : 0;
    const minDrinkPrice = drinks.length > 0 ? Math.min(...drinks.map(d => d.price)) : 0;
    const minDessertPrice = desserts.length > 0 ? Math.min(...desserts.map(e => e.price)) : 0;

    // 🟢 NOUVEAU CALCUL DYNAMIQUE DU PRIX TOTAL (Seule la boisson a -1€)
    let currentPrice = product.price;
    if (isMenu) {
        currentPrice = 0;
        if (selectedBurger) currentPrice += selectedBurger.price; // Prix normal
        if (selectedDrink) currentPrice += Math.max(0, selectedDrink.price - 1); // Réduction de 1€ sur la boisson
        if (menuType === 'maxi' && selectedDessert) currentPrice += selectedDessert.price; // Prix normal
    }

    const handleConfirm = () => {
        let finalNote = note;
        let productToAdd = { ...product };

        if (isMenu) {
            if (!selectedBurger || !selectedDrink) return;
            if (menuType === 'maxi' && !selectedDessert) return;

            const menuSelections = [
                `${selectedBurger.name}`,
                `${selectedDrink.name}`,
                selectedDessert ? `${selectedDessert.name}` : null
            ].filter(Boolean).join(' | ');

            finalNote = note.trim() ? `${menuSelections} (${note})` : menuSelections;

            productToAdd.price = currentPrice;
            productToAdd.id = `${product.id}-${selectedBurger.id}-${selectedDrink.id}${selectedDessert ? '-' + selectedDessert.id : ''}`;
        }

        onAddToCart(productToAdd, quantity, finalNote);
        onClose();
    };

    const isMenuIncomplete = isMenu && (!selectedBurger || !selectedDrink || (menuType === 'maxi' && !selectedDessert));

    // 🟢 HELPER D'AFFICHAGE : N'affiche un prix que s'il y a un supplément
    const renderOptionText = (name: string, price: number, minPrice: number) => {
        const diff = price - minPrice;
        return diff > 0 ? `${name} (+${diff.toFixed(2)} €)` : name;
    };

    return (
        <BaseBottomSheet isVisible={isVisible} title={product.name} onClose={onClose}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {product.imageUrl && <Image source={{ uri: product.imageUrl }} style={styles.mainImage} />}
                <Typography variant="body" style={styles.description}>{product.description}</Typography>

                {isMenu && (
                    <View style={styles.menuComposer}>

                        <Typography variant="subtitle" style={styles.stepTitle}>1. Choisis ton Burger *</Typography>
                        <View style={styles.optionsGrid}>
                            {burgers.map(b => (
                                <TouchableOpacity
                                    key={b.id}
                                    style={[styles.optionCard, selectedBurger?.id === b.id && styles.optionCardActive]}
                                    onPress={() => { feedbackService.light(); setSelectedBurger(b); }}
                                >
                                    <Typography variant="body" style={[styles.optionText, selectedBurger?.id === b.id && styles.optionTextActive]}>
                                        {renderOptionText(b.name, b.price, minBurgerPrice)}
                                    </Typography>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Typography variant="subtitle" style={[styles.stepTitle, { marginTop: 16 }]}>2. Choisis ta Boisson *</Typography>
                        <View style={styles.optionsGrid}>
                            {drinks.map(d => (
                                <TouchableOpacity
                                    key={d.id}
                                    style={[styles.optionCard, selectedDrink?.id === d.id && styles.optionCardActive]}
                                    onPress={() => { feedbackService.light(); setSelectedDrink(d); }}
                                >
                                    <Typography variant="body" style={[styles.optionText, selectedDrink?.id === d.id && styles.optionTextActive]}>
                                        {renderOptionText(d.name, d.price, minDrinkPrice)}
                                    </Typography>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {menuType === 'maxi' && (
                            <>
                                <Typography variant="subtitle" style={[styles.stepTitle, { marginTop: 16 }]}>3. Choisis ton Dessert *</Typography>
                                <View style={styles.optionsGrid}>
                                    {desserts.map(e => (
                                        <TouchableOpacity
                                            key={e.id}
                                            style={[styles.optionCard, selectedDessert?.id === e.id && styles.optionCardActive]}
                                            onPress={() => { feedbackService.light(); setSelectedDessert(e); }}
                                        >
                                            <Typography variant="body" style={[styles.optionText, selectedDessert?.id === e.id && styles.optionTextActive]}>
                                                {renderOptionText(e.name, e.price, minDessertPrice)}
                                            </Typography>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </View>
                )}

                <View style={styles.divider} />

                <View style={styles.quantityRow}>
                    <Typography variant="subtitle" style={{ marginBottom: 0 }}>Quantité</Typography>
                    <View style={styles.stepper}>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => { feedbackService.light(); setQuantity(q => Math.max(1, q - 1)); }}>
                            <Typography variant="title" style={styles.stepBtnText}>-</Typography>
                        </TouchableOpacity>
                        <Typography variant="subtitle" style={styles.quantityValue}>{quantity}</Typography>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => { feedbackService.light(); setQuantity(q => q + 1); }}>
                            <Typography variant="title" style={styles.stepBtnText}>+</Typography>
                        </TouchableOpacity>
                    </View>
                </View>

                <Button
                    title={isMenuIncomplete
                        ? "Configure ton menu"
                        : `Ajouter au panier — ${(currentPrice * quantity).toFixed(2)} €`
                    }
                    disabled={isMenuIncomplete}
                    onPress={handleConfirm}
                />
            </ScrollView>
        </BaseBottomSheet>
    );
};

const styles = StyleSheet.create({
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    mainImage: { width: '100%', aspectRatio: 1, borderRadius: 20, marginBottom: 16 },
    description: { color: Colors.textMuted, fontSize: 14, marginBottom: 20 },
    divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: 20 },
    quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: Colors.surfaceBorder },
    stepBtn: { width: 36, height: 36, backgroundColor: Colors.surfaceLight, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    stepBtnText: { marginBottom: 0, fontSize: 18 },
    quantityValue: { marginHorizontal: 16, marginBottom: 0, fontFamily: 'Inter_700Bold' },

    menuComposer: { marginTop: 10 },
    stepTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.primary, marginBottom: 10 },
    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    optionCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    optionText: { marginBottom: 0, fontSize: 13, color: Colors.text },
    optionTextActive: { color: '#000', fontFamily: 'Inter_700Bold' }
});