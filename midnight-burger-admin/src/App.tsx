// src/App.tsx
import { useState, useRef, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import OrdersBoard from './components/OrdersBoard';
import StockManager from './components/StockManager';
import CatalogEditor from './components/CatalogEditor';
// 🟢 Import des nouvelles icônes pour la navigation
import { FaBell, FaHamburger, FaMapMarkedAlt, FaListUl, FaHistory, FaBoxes, FaPen } from 'react-icons/fa';
import OrderHistory from './components/OrderHistory';
import { DeliveryMap } from './components/DeliveryMap';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isMidnightAdmin') === 'true';
  });

  const [isServiceStarted, setIsServiceStarted] = useState(() => {
    return localStorage.getItem('isMidnightServiceStarted') === 'true';
  });

  useEffect(() => {
    if (isServiceStarted && !audioRef.current) {
      audioRef.current = new Audio('/ring.mp3');
    }
  }, [isServiceStarted]);

  // 🟢 On inclut bien l'onglet "map"
  const [activeTab, setActiveTab] = useState<'map' | 'orders' | 'history' | 'stock' | 'catalog'>('map');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleLogin = () => {
    localStorage.setItem('isMidnightAdmin', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isMidnightAdmin');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (!isServiceStarted) {
    return (
      <div style={styles.startScreen}>
        <style>
          {`
            body { margin: 0; background-color: #000000; font-family: 'Inter', system-ui, sans-serif; }
            .glass-btn { transition: all 0.2s ease; }
            .glass-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
            .glass-btn:active { transform: translateY(0); }
          `}
        </style>
        <div style={styles.startCard}>
          <div style={styles.iconContainer}>
            <FaBell size={32} color="#F5E134" />
          </div>
          <h1 style={styles.startTitle}>Interface Midnight</h1>
          <p style={styles.startSubtitle}>Active les alertes sonores pour le dispatch des livreurs.</p>
          <button
            className="glass-btn"
            style={styles.startButton}
            onClick={() => {
              localStorage.setItem('isMidnightServiceStarted', 'true');
              setIsServiceStarted(true);
              audioRef.current = new Audio('/ring.mp3');
              audioRef.current.play().then(() => {
                audioRef.current?.pause();
                if (audioRef.current) audioRef.current.currentTime = 0;
              }).catch(() => { });
            }}
          >
            ▶ Démarrer le service
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <style>
        {`
            body { margin: 0; background-color: #000000; font-family: 'Inter', system-ui, sans-serif; }
            .nav-btn { transition: all 0.2s ease; }
            .nav-btn:hover { background-color: rgba(255, 255, 255, 0.1); }

            .responsive-navbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 30px; }
            .nav-top-row { display: flex; align-items: center; gap: 12px; }
            
            /* 🟢 Refonte des onglets pour mobile (sur une seule ligne) */
            .responsive-tabs { display: flex; gap: 8px; justify-content: center; }

            @media (max-width: 768px) {
              .responsive-navbar { flex-direction: column; gap: 12px; padding: 12px 16px; }
              .nav-top-row { width: 100%; justify-content: space-between; }
              .responsive-tabs { width: 100%; justify-content: space-between; gap: 4px; }
              .responsive-tabs button { flex: 1; padding: 12px 0 !important; display: flex; justify-content: center; }
            }
          `}
      </style>

      <nav className="responsive-navbar" style={styles.navbarBase}>
        <div className="nav-top-row">
          <div style={styles.navLeft}>
            <FaHamburger size={24} color="#F5E134" />
            <h2 style={styles.logo}>Midnight Admin</h2>
          </div>
          <button className="nav-btn" style={styles.logoutButton} onClick={handleLogout}>
            Déconnexion
          </button>
        </div>

        {/* 🟢 BLOC NAVIGATION AVEC ICÔNES */}
        <div className="responsive-tabs" style={styles.navTabs}>
          <button
            className="nav-btn"
            title="Carte (GPS)"
            style={{
              ...styles.tabButton,
              backgroundColor: activeTab === 'map' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: activeTab === 'map' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)'
            }}
            onClick={() => setActiveTab('map')}
          >
            <FaMapMarkedAlt size={22} />
          </button>

          <button
            className="nav-btn"
            title="Courses en attente"
            style={{
              ...styles.tabButton,
              backgroundColor: activeTab === 'orders' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: activeTab === 'orders' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)'
            }}
            onClick={() => setActiveTab('orders')}
          >
            <FaListUl size={22} />
          </button>

          <button
            className="nav-btn"
            title="Historique des commandes"
            style={{
              ...styles.tabButton,
              backgroundColor: activeTab === 'history' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: activeTab === 'history' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)'
            }}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory size={22} />
          </button>

          <button
            className="nav-btn"
            title="Gestion des stocks"
            style={{
              ...styles.tabButton,
              backgroundColor: activeTab === 'stock' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: activeTab === 'stock' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)'
            }}
            onClick={() => setActiveTab('stock')}
          >
            <FaBoxes size={22} />
          </button>

          <button
            className="nav-btn"
            title="Édition du catalogue"
            style={{
              ...styles.tabButton,
              backgroundColor: activeTab === 'catalog' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              color: activeTab === 'catalog' ? '#FFFFFF' : 'rgba(235, 235, 245, 0.6)'
            }}
            onClick={() => setActiveTab('catalog')}
          >
            <FaPen size={20} />
          </button>
        </div>
      </nav>

      <main style={styles.mainContent}>
        {activeTab === 'map' && <DeliveryMap />}
        {activeTab === 'orders' && <OrdersBoard audioRef={audioRef} />}
        {activeTab === 'history' && <OrderHistory />}
        {activeTab === 'stock' && <StockManager />}
        {activeTab === 'catalog' && <CatalogEditor />}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  startScreen: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000', color: '#FFFFFF' },
  startCard: { backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '40px', borderRadius: '32px', textAlign: 'center', maxWidth: '400px', margin: '0 20px', border: '1px solid rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
  iconContainer: { width: '64px', height: '64px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid rgba(255, 255, 255, 0.2)' },
  startTitle: { margin: '0 0 10px 0', fontSize: '24px', fontWeight: 700 },
  startSubtitle: { color: 'rgba(235, 235, 245, 0.6)', margin: '0 0 30px 0', fontSize: '15px', lineHeight: '1.5' },
  startButton: { padding: '16px 24px', fontSize: '16px', backgroundColor: '#F5E134', color: '#000', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 700, width: '100%' },
  
  appContainer: { 
    height: '100vh', // 🟢 On force la hauteur à 100% de l'écran (au lieu de minHeight)
    overflow: 'hidden', // 🟢 On bloque le scroll global de la page
    backgroundColor: '#000000', 
    display: 'flex', 
    flexDirection: 'column', 
    color: '#FFFFFF' 
  },
  // ... (ne touche pas au reste)
  mainContent: { 
    flexGrow: 1, 
    overflowY: 'auto', // 🟢 Le scroll se fera uniquement ici pour les autres onglets !
    display: 'flex', 
    flexDirection: 'column' 
  },
  navbarBase: { backgroundColor: 'rgba(25, 25, 25, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', position: 'sticky', top: 0, zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  logo: { margin: 0, fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' },
  
  navTabs: { backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' },
  tabButton: { border: 'none', cursor: 'pointer', padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  logoutButton: { backgroundColor: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', border: '1px solid rgba(255, 69, 58, 0.3)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },

};