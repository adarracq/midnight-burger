// src/components/molecules/CartItemRow.tsx
import { Colors } from '@/src/constants/theme';
import { Minus, Plus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Product } from '../../models/Product';
import { Typography } from '../atoms/Typography';

interface CartItemRowProps {
    product: Product;
    note?: string;
    quantity: number;
    onAdd: () => void;
    onRemove: () => void;
}

export const CartItemRow = ({ product, note, quantity, onAdd, onRemove }: CartItemRowProps) => {
    return (
        <View style={styles.glassRow}>
            <View style={styles.info}>
                <Typography variant="subtitle">{product.name}</Typography>
                {note && <Typography variant="body">{note}</Typography>}
                <Typography variant="price">{(product.price * quantity).toFixed(2)} €</Typography>
            </View>

            <View style={styles.counterBox}>
                <TouchableOpacity style={styles.btn} onPress={onRemove}>
                    <Minus color={Colors.text} size={16} />
                </TouchableOpacity>
                <Text style={styles.quantity}>{quantity}</Text>
                <TouchableOpacity style={styles.btn} onPress={onAdd}>
                    <Plus color={Colors.text} size={16} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    glassRow: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 20,
        marginBottom: 14,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        // Ombre portée
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    info: {
        flex: 1
    },
    counterBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    btn: {
        width: 40,
        height: 40,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    quantity: {
        marginHorizontal: 14,
        fontSize: 16,
        color: Colors.text,
        fontFamily: 'Inter_700Bold', // En supposant que tu as ajouté la police
    },
});