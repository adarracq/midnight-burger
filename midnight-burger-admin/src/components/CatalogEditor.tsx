// src/components/CatalogEditor.tsx
import React, { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { MdDeleteForever, MdModeEdit, MdArrowUpward, MdArrowDownward } from "react-icons/md";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    orderIndex?: number;
    menuType?: 'classic' | 'maxi'; // 🟢 Ajout du type de menu
}

export default function CatalogEditor() {
    const [products, setProducts] = useState<Product[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('burger');

    // 🟢 Nouvel état pour le type de menu (par défaut "classic")
    const [menuType, setMenuType] = useState<'classic' | 'maxi'>('classic');

    const [existingImageUrl, setExistingImageUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
            setProducts(items);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) return alert("Le nom et le prix sont obligatoires.");

        setIsUploading(true);
        let finalImageUrl = existingImageUrl;

        try {
            if (imageFile) {
                const uniqueFileName = `${Date.now()}-${imageFile.name}`;
                const storageRef = ref(storage, `products/${uniqueFileName}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                finalImageUrl = await getDownloadURL(snapshot.ref);
            }

            const currentCategoryProducts = products.filter(p => p.category === category);
            const defaultOrderIndex = currentCategoryProducts.length;

            const productData: any = {
                name, description, price: parseFloat(price), category,
                available: true, imageUrl: finalImageUrl
            };

            // 🟢 On n'enregistre menuType QUE si c'est un menu
            if (category === 'menu') {
                productData.menuType = menuType;
            }

            if (editingId) {
                const oldProduct = products.find(p => p.id === editingId);
                productData.orderIndex = oldProduct?.orderIndex !== undefined ? oldProduct.orderIndex : defaultOrderIndex;
                await updateDoc(doc(db, 'products', editingId), productData);
            } else {
                productData.orderIndex = defaultOrderIndex;
                await addDoc(collection(db, 'products'), productData);
            }

            handleCancelEdit();
        } catch (error) {
            console.error("Erreur :", error);
            alert("Erreur lors de l'enregistrement.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Es-tu sûr de vouloir supprimer ce produit ?")) {
            await deleteDoc(doc(db, 'products', id));
        }
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setName(product.name);
        setDescription(product.description || '');
        setPrice(product.price.toString());
        setCategory(product.category || 'burger');

        // 🟢 On recharge le menuType s'il existe, sinon on met classic par défaut
        setMenuType(product.menuType || 'classic');

        setExistingImageUrl(product.imageUrl || '');
        setImageFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName(''); setDescription(''); setPrice(''); setCategory('burger');
        setMenuType('classic'); // 🟢 Reset du menuType
        setImageFile(null); setExistingImageUrl('');
    };

    const handleMoveProduct = async (product: Product, direction: 'up' | 'down') => {
        const currentCategoryItems = [...(groupedProducts[product.category] || [])];
        const currentIndex = currentCategoryItems.findIndex(p => p.id === product.id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= currentCategoryItems.length) return;

        const temp = currentCategoryItems[currentIndex];
        currentCategoryItems[currentIndex] = currentCategoryItems[targetIndex];
        currentCategoryItems[targetIndex] = temp;

        try {
            const updatePromises = currentCategoryItems.map((p, newIndex) => {
                if (p.orderIndex !== newIndex) {
                    return updateDoc(doc(db, 'products', p.id), { orderIndex: newIndex });
                }
                return Promise.resolve();
            });

            await Promise.all(updatePromises);
        } catch (error) {
            console.error("Erreur lors du tri :", error);
            alert("Erreur lors de la réorganisation.");
        }
    };

    const groupedProducts = products.reduce((acc, p) => {
        const cat = p.category || 'Autre';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {} as Record<string, Product[]>);

    Object.keys(groupedProducts).forEach(category => {
        groupedProducts[category].sort((a, b) => {
            const indexA = a.orderIndex !== undefined ? a.orderIndex : 999;
            const indexB = b.orderIndex !== undefined ? b.orderIndex : 999;
            return indexA - indexB;
        });
    });

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
                <h2 style={styles.headerTitle}>Édition du catalogue</h2>
            </header>

            <div style={styles.formCard}>
                <h3 style={styles.formTitle}>{editingId ? '✏️ Modifier le produit' : '➕ Ajouter un nouveau produit'}</h3>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input style={styles.input} placeholder="Nom" value={name} onChange={e => setName(e.target.value)} required />
                    <input style={styles.input} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

                    <div style={styles.row}>
                        <input style={styles.input} type="number" step="0.10" placeholder="Prix (€)" value={price} onChange={e => setPrice(e.target.value)} required />

                        <select style={styles.input} value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="menu" style={{ color: '#000' }}>Menu</option>
                            <option value="burger" style={{ color: '#000' }}>Burger</option>
                            <option value="side" style={{ color: '#000' }}>Accompagnement</option>
                            <option value="drink" style={{ color: '#000' }}>Boisson</option>
                            <option value="dessert" style={{ color: '#000' }}>Dessert</option>
                        </select>
                    </div>

                    {/* 🟢 CHAMP CONDITIONNEL : Apparaît uniquement si la catégorie est "Menu" */}
                    {category === 'menu' && (
                        <div style={styles.menuTypeContainer}>
                            <label style={styles.menuTypeLabel}>Type de Menu :</label>
                            <select style={styles.input} value={menuType} onChange={e => setMenuType(e.target.value as 'classic' | 'maxi')}>
                                <option value="classic" style={{ color: '#000' }}>Classique (Burger + Boisson)</option>
                                <option value="maxi" style={{ color: '#000' }}>Maxi (Burger + Boisson + Dessert)</option>
                            </select>
                        </div>
                    )}

                    <div style={styles.imageInputContainer}>
                        <label style={styles.imageLabel}>Photo de l'application :</label>
                        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} style={styles.fileInput} />
                        {existingImageUrl && !imageFile && (
                            <p style={styles.existingImageText}>Image actuelle enregistrée. Ajoute un fichier pour la remplacer.</p>
                        )}
                    </div>

                    <div style={styles.formActions}>
                        <button type="submit" style={styles.btnPrimary} disabled={isUploading}>
                            {isUploading ? 'Enregistrement...' : (editingId ? 'Enregistrer' : 'Créer le produit')}
                        </button>
                        {editingId && (
                            <button type="button" onClick={handleCancelEdit} style={styles.btnSecondary} disabled={isUploading}>Annuler</button>
                        )}
                    </div>
                </form>
            </div>

            <div style={styles.catalogList}>
                {Object.keys(groupedProducts).length === 0 && (
                    <p style={styles.emptyText}>Aucun produit dans le catalogue.</p>
                )}

                {Object.keys(groupedProducts).sort().map(category => (
                    <div key={category} style={styles.categorySection}>
                        <h3 style={styles.categoryTitle}>{formatCategoryTitle(category)}</h3>

                        <div style={styles.productsGrid}>
                            {groupedProducts[category].map((product, index) => (
                                <div key={product.id} style={styles.productCard}>

                                    {product.imageUrl ? (
                                        <div style={{ ...styles.imagePreview, backgroundImage: `url(${product.imageUrl})` }} />
                                    ) : (
                                        <div style={styles.noImagePlaceholder}>
                                            <span style={styles.noImageText}>Pas de photo</span>
                                        </div>
                                    )}

                                    <div style={styles.productInfo}>
                                        <div style={styles.productHeader}>
                                            <strong style={styles.productName}>{product.name}</strong>
                                            <span style={styles.price}>{product.price.toFixed(2)} €</span>
                                        </div>

                                        <p style={styles.description}>
                                            {product.description || <span style={styles.emptyDesc}>Aucune description</span>}
                                        </p>

                                        {/* 🟢 Petit badge visuel pour distinguer les menus dans la liste */}
                                        {product.category === 'menu' && product.menuType && (
                                            <span style={styles.menuBadge}>
                                                {product.menuType === 'maxi' ? 'Maxi (Burger+Boisson+Dessert)' : 'Classique (Burger+Boisson)'}
                                            </span>
                                        )}

                                        <div style={styles.actionsBox}>
                                            <button
                                                onClick={() => handleMoveProduct(product, 'up')}
                                                style={styles.btnMove}
                                                disabled={index === 0}
                                                title="Monter"
                                            >
                                                <MdArrowUpward size={18} color={index === 0 ? "rgba(255,255,255,0.2)" : "#FFF"} />
                                            </button>
                                            <button
                                                onClick={() => handleMoveProduct(product, 'down')}
                                                style={styles.btnMove}
                                                disabled={index === groupedProducts[category].length - 1}
                                                title="Descendre"
                                            >
                                                <MdArrowDownward size={18} color={index === groupedProducts[category].length - 1 ? "rgba(255,255,255,0.2)" : "#FFF"} />
                                            </button>

                                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                                                <button onClick={() => handleEdit(product)} style={styles.btnEdit}>
                                                    <MdModeEdit size={20} color="#5D8ACD" />
                                                </button>
                                                <button onClick={() => handleDelete(product.id)} style={styles.btnDelete}>
                                                    <MdDeleteForever size={20} color="#FF453A" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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

    formCard: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.15)', marginBottom: '40px' },
    formTitle: { marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 600 },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    row: { display: 'flex', gap: '12px' },
    input: { flex: 1, padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#FFF', fontSize: '15px' },

    // 🟢 Nouveaux styles pour le menuType
    menuTypeContainer: { padding: '16px', backgroundColor: 'rgba(93, 138, 205, 0.1)', borderRadius: '12px', border: '1px solid rgba(93, 138, 205, 0.3)' },
    menuTypeLabel: { display: 'block', fontWeight: 600, marginBottom: '10px', color: '#5D8ACD', fontSize: '14px' },
    menuBadge: { display: 'inline-block', backgroundColor: 'rgba(93, 138, 205, 0.2)', color: '#5D8ACD', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, marginBottom: '10px', width: 'fit-content' },

    imageInputContainer: { padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)' },
    imageLabel: { display: 'block', fontWeight: 600, marginBottom: '12px', color: 'rgba(235, 235, 245, 0.8)', fontSize: '14px' },
    fileInput: { width: '100%', color: '#FFF' },
    existingImageText: { fontSize: '12px', color: 'rgba(235, 235, 245, 0.6)', marginTop: '8px', fontStyle: 'italic' },
    formActions: { display: 'flex', gap: '12px', marginTop: '10px' },
    btnPrimary: { backgroundColor: '#F5E134', color: '#000', border: 'none', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '14px', flex: 1 },
    btnSecondary: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', flex: 1 },

    catalogList: { display: 'flex', flexDirection: 'column', gap: '32px' },
    emptyText: { textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' },
    categorySection: { display: 'flex', flexDirection: 'column', gap: '16px' },
    categoryTitle: { textAlign: 'left', margin: 0, fontSize: '15px', fontWeight: 700, color: '#F5E134', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
    productsGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },

    productCard: { display: 'flex', flexDirection: 'row', gap: '20px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', alignItems: 'stretch' },
    imagePreview: { width: '100px', height: '100px', borderRadius: '12px', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 },
    noImagePlaceholder: { width: '100px', height: '100px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    noImageText: { fontSize: '11px', color: 'rgba(235, 235, 245, 0.4)', textAlign: 'center' },
    productInfo: { display: 'flex', flexDirection: 'column', flex: 1 },
    productHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
    productName: { fontSize: '18px', fontWeight: 700, color: '#FFF' },
    price: { fontSize: '16px', fontWeight: 700 },
    description: { fontSize: '14px', color: 'rgba(235, 235, 245, 0.7)', lineHeight: '1.4', margin: '0 0 10px 0', flexGrow: 1 },
    emptyDesc: { fontStyle: 'italic', opacity: 0.5 },
    actionsBox: { display: 'flex', gap: '12px', marginTop: 'auto', alignItems: 'center' },

    btnMove: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFF', border: '1px solid rgba(255, 255, 255, 0.15)', height: '40px', width: '40px', borderRadius: '8px', cursor: 'pointer' },
    btnEdit: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(93, 138, 205, 0.1)', color: '#5D8ACD', border: '1px solid rgba(93, 138, 205, 0.3)', height: '40px', width: '40px', borderRadius: '8px', cursor: 'pointer' },
    btnDelete: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', border: '1px solid rgba(255, 69, 58, 0.3)', height: '40px', width: '40px', borderRadius: '8px', cursor: 'pointer' }
};