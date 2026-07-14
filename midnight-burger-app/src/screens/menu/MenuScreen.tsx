// src/screens/MenuScreen.tsx
import { Typography } from "@/src/components/atoms/Typography";
import { CustomAlert } from "@/src/components/molecules/CustomAlert";
import { ProductCard } from "@/src/components/molecules/ProductCard";
import { ProductModal } from "@/src/components/organisms/ProductModal";
import { UpsellModal } from "@/src/components/organisms/UpsellModal";
import { Colors } from "@/src/constants/theme";
import { useCart } from "@/src/context/CartContext";
import { Product } from "@/src/models/Product";
import { feedbackService } from "@/src/services/feedbackService";
import { collection, getDocs } from "firebase/firestore";
import { ShoppingBasket } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react"; // 🟢 Ajout de useMemo et useCallback
import {
    ActivityIndicator,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../../firebaseConfig";
import { CartModal } from "../cart/CartModal";

const CATEGORIES = ["tout", "menu", "burger", "drink", "dessert"];

type SectionData = { title: string; data: Product[] };

export const MenuScreen = () => {
  const [allSections, setAllSections] = useState<SectionData[]>([]);
  const [displayedSections, setDisplayedSections] = useState<SectionData[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>("tout");

  const [isCartVisible, setIsCartVisible] = useState<boolean>(false);
  const [isProductModalVisible, setIsProductModalVisible] =
    useState<boolean>(false);
  const [flatProducts, setFlatProducts] = useState<Product[]>([]);
  const [isUpsellVisible, setIsUpsellVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { cart, addToCart, removeFromCart, cartTotal } = useCart();

  const [isOpen, setIsOpen] = useState<boolean>(true);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "error" | "info" | "warning" | "success";
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    const checkTime = () => {
      const currentHour = new Date().getHours();
      setIsOpen(currentHour >= 23 || currentHour < 6);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const items: Product[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as Product);
        });

        setFlatProducts(items);

        const grouped = CATEGORIES.filter((c) => c !== "tout")
          .map((cat) => ({
            title: cat,
            data: items
              .filter((p) => p.category === cat)
              .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)),
          }))
          .filter((section) => section.data.length > 0);

        setAllSections(grouped);
        setDisplayedSections(grouped);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 🟢 OPTIMISATION 1 : On pré-calcule les quantités du panier une seule fois.
  // Cela évite de filtrer tout le panier pour chaque produit à chaque milliseconde de scroll !
  const cartQuantities = useMemo(() => {
    const counts: Record<string, number> = {};
    cart.forEach((item) => {
      counts[item.id] = (counts[item.id] || 0) + 1;
    });
    return counts;
  }, [cart]);

  const handleAddToCartWithUpsell = useCallback(
    (product: Product, quantity: number, note: string) => {
      for (let i = 0; i < quantity; i++) {
        addToCart(product, note);
      }

      if (product.category === "burger" || product.category === "menu") {
        setTimeout(() => {
          feedbackService.light();
          setIsUpsellVisible(true);
        }, 400);
      }
    },
    [addToCart],
  );

  const availableDesserts = useMemo(
    () =>
      flatProducts.filter(
        (p) => p.category === "dessert" && p.available !== false,
      ),
    [flatProducts],
  );

  const handleFilter = (category: string) => {
    setActiveCategory(category);
    if (category === "tout") {
      setDisplayedSections(allSections);
    } else {
      const filtered = allSections.filter(
        (section) => section.title === category,
      );
      setDisplayedSections(filtered);
    }
  };

  const showAlert = (
    title: string,
    message: string,
    type: "error" | "info" | "warning" | "success",
  ) => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const handleOpenProduct = useCallback(
    (product: Product) => {
      if (!isOpen) {
        feedbackService.error();
        return showAlert(
          "Fermé",
          "Nous sommes actuellement fermés.\nLes commandes sont disponibles de 23h00 à 06h00.",
          "warning",
        );
      }

      if (product.available === false) {
        feedbackService.error();
        return;
      }
      feedbackService.light();
      setSelectedProduct(product);
      setIsProductModalVisible(true);
    },
    [isOpen],
  );

  // 🟢 OPTIMISATION 2 : On fige la fonction de rendu pour éviter qu'elle ne se recrée en boucle
  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        quantityInCart={cartQuantities[item.id] || 0} // 🟢 Utilisation de la map ultra-rapide
        onPressCard={() => handleOpenProduct(item)}
        onAdd={() => {
          if (!isOpen) {
            feedbackService.error();
            return showAlert(
              "Fermé",
              "Nous sommes actuellement fermés.\nLes commandes sont disponibles de 23h00 à 06h00.",
              "warning",
            );
          }
          feedbackService.light();
          if (item.category === "menu") {
            handleOpenProduct(item);
          } else {
            handleAddToCartWithUpsell(item, 1, "");
          }
        }}
        onRemove={() => {
          feedbackService.light();
          removeFromCart(item.id);
        }}
      />
    ),
    [
      cartQuantities,
      isOpen,
      handleOpenProduct,
      handleAddToCartWithUpsell,
      removeFromCart,
    ],
  );

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <Typography variant="title" style={styles.header}>
          Le Menu
        </Typography>

        {isOpen ? (
          <Typography variant="body" style={styles.sectionSubtitle}>
            LIVRAISON DE 23H00 À 6H00 (GRATUITE)
          </Typography>
        ) : (
          <View style={styles.closedBanner}>
            <Typography variant="body" style={styles.closedText}>
              Nous sommes actuellement fermés.{"\n"}Les commandes sont
              disponibles de 23h00 à 06h00.
            </Typography>
          </View>
        )}

        <View style={styles.segmentContainer}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.segmentBtn,
                activeCategory === cat && styles.segmentBtnActive,
              ]}
              onPress={() => {
                handleFilter(cat);
                feedbackService.light();
              }}
            >
              <Typography
                variant="body"
                style={[
                  styles.segmentText,
                  activeCategory === cat && styles.segmentTextActive,
                ]}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : (
        <SectionList
          sections={displayedSections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          // 🟢 OPTIMISATIONS DE LA SECTION LIST
          initialNumToRender={8} // Ne charge que 8 items au premier affichage
          maxToRenderPerBatch={5} // Rend les items par paquets de 5 (évite de bloquer l'UI)
          windowSize={5} // Garde peu d'écrans virtuels en mémoire (défaut: 21, on passe à 5)
          removeClippedSubviews={true} // Décharge les images hors de l'écran de la RAM
          updateCellsBatchingPeriod={50} // Laisse respirer le processeur entre deux calculs
          ListEmptyComponent={
            <Typography variant="body" style={styles.emptyText}>
              Aucun produit dans cette catégorie.
            </Typography>
          }
          renderSectionHeader={({ section: { title } }) => (
            <Typography variant="subtitle" style={styles.sectionHeader}>
              {title.toUpperCase()}
            </Typography>
          )}
          renderItem={renderItem} // 🟢 Appel du renderItem optimisé
          stickySectionHeadersEnabled={true}
        />
      )}

      {cart.length > 0 && (
        <TouchableOpacity
          style={styles.glassCartButton}
          onPress={() => {
            feedbackService.light();
            setIsCartVisible(true);
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <ShoppingBasket size={20} color="#000" />
            <Text style={styles.cartButtonText}>Panier ({cart.length})</Text>
          </View>
          <Text style={styles.cartButtonPrice}>{cartTotal.toFixed(2)} €</Text>
        </TouchableOpacity>
      )}

      <CartModal
        isVisible={isCartVisible}
        onClose={() => setIsCartVisible(false)}
      />

      <ProductModal
        isVisible={isProductModalVisible}
        product={selectedProduct}
        allProducts={flatProducts}
        onClose={() => setIsProductModalVisible(false)}
        onAddToCart={handleAddToCartWithUpsell}
      />
      <UpsellModal
        isVisible={isUpsellVisible}
        onClose={() => setIsUpsellVisible(false)}
        desserts={availableDesserts}
        onAddDessert={(dessert) => addToCart(dessert, "")}
      />

      <CustomAlert
        isVisible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topContainer: { backgroundColor: Colors.background, paddingTop: 60 },
  header: { marginLeft: 20 },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 20,
    marginLeft: 20,
  },

  closedBanner: {
    backgroundColor: Colors.error + "20",
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + "40",
  },
  closedText: {
    color: Colors.error,
    fontSize: 13,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 0,
  },

  loader: { marginTop: 50 },
  list: { paddingHorizontal: 20, paddingBottom: 120 },
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingTop: 24,
    paddingBottom: 12,
    color: Colors.text,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontStyle: "italic",
    color: Colors.textMuted,
  },
  glassCartButton: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartButtonText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  cartButtonPrice: { color: "#000", fontSize: 18, fontFamily: "Inter_700Bold" },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    padding: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  segmentBtnActive: { backgroundColor: Colors.surfaceLight },
  segmentText: {
    marginBottom: 0,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  segmentTextActive: { color: Colors.text },
});
