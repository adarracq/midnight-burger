// src/components/StockManager.tsx
import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface Product {
    id: string;
    name: string;
    category: string;
    available: boolean;
}

export default function StockManager() {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
            setProducts(items);
        });
        return () => unsubscribe();
    }, []);

    const toggleAvailable = async (product: Product) => {
        await updateDoc(doc(db, 'products', product.id), { available: !product.available });
    };

    // 🟢 Regroupement par catégorie
    const groupedProducts = products.reduce((acc, p) => {
        const cat = p.category || 'Autre';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {} as Record<string, Product[]>);

    // Traduction propre des catégories pour l'affichage
    const formatCategoryTitle = (cat: string) => {
        const translations: Record<string, string> = {
            'menu': 'Menus',
            'burger': 'Burgers',
            'side': 'Accompagnements',
            'drink': 'Boissons',
            'dessert': 'Desserts'
        };
        return translations[cat.toLowerCase()] || cat.toUpperCase();
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.headerTitle}>Gestion des Stocks</h2>
            </header>

            <div style={styles.content}>
                {Object.keys(groupedProducts).length === 0 && (
                    <p style={styles.emptyText}>Aucun produit dans le catalogue.</p>
                )}

                {Object.keys(groupedProducts).sort().map(category => (
                    <div key={category} style={styles.categorySection}>
                        <h3 style={styles.categoryTitle}>{formatCategoryTitle(category)}</h3>

                        <div style={styles.list}>
                            {groupedProducts[category].map(product => (
                                <div key={product.id} style={{ ...styles.row, opacity: product.available ? 1 : 0.6 }}>
                                    <strong style={styles.productName}>{product.name}</strong>

                                    <button
                                        onClick={() => toggleAvailable(product)}
                                        style={product.available ? styles.btnWarning : styles.btnSuccess}
                                    >
                                        {product.available ? 'Rupture' : 'En stock'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: { padding: '20px 15px', maxWidth: '800px', margin: '0 auto' },
    header: { marginBottom: '24px', paddingBottom: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
    headerTitle: { margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' },
    content: { display: 'flex', flexDirection: 'column', gap: '32px' },
    categorySection: { display: 'flex', flexDirection: 'column', gap: '12px' },
    categoryTitle: {
        textAlign: 'left',
        margin: 0, fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)',
        textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    },
    list: { display: 'flex', flexDirection: 'column', gap: '8px' },
    row: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px',
        padding: '16px 20px', transition: 'opacity 0.2s ease'
    },
    productName: { fontSize: '16px', fontWeight: 600, color: '#FFF' },
    btnSuccess: { backgroundColor: '#32D74B', color: '#000', border: 'none', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' },
    btnWarning: { backgroundColor: 'rgba(255, 69, 58, 0.15)', color: '#FF453A', border: '1px solid rgba(255, 69, 58, 0.3)', borderRadius: '10px', padding: '10px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' },
    emptyText: { textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }
};