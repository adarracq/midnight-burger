// src/context/CartContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Product } from '../models/Product';

interface CartContextType {
    cart: (Product & { note: string })[];
    addToCart: (product: Product, note: string) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<(Product & { note: string })[]>([]);

    const addToCart = (product: Product, note: string) => {
        setCart((prev) => [...prev, { ...product, note }]);
    };

    const removeFromCart = (productId: string) => {
        // On retire seulement la première occurrence du produit (s'il en a pris 2)
        setCart((prev) => {
            const index = prev.findIndex((p) => p.id === productId);
            if (index === -1) return prev;
            const newCart = [...prev];
            newCart.splice(index, 1);
            return newCart;
        });
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((total, item) => total + item.price, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart doit être utilisé dans un CartProvider");
    return context;
};