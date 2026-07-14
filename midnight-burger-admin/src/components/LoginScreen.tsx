// src/components/LoginScreen.tsx
import React, { useState } from 'react';
import { FaHamburger } from 'react-icons/fa';

interface LoginScreenProps {
    onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);

    // 🔴 MOT DE PASSE EN DUR (À changer selon tes envies)
    const ADMIN_PASSWORD = "test1234";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            onLogin();
        } else {
            setError(true);
            setPassword('');
            // Déclenche l'animation de tremblement
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    return (
        <div style={styles.container}>
            {/* Styles globaux et animations injectés */}
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                    
                    body {
                        margin: 0;
                        background-color: #000000;
                    }

                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                        20%, 40%, 60%, 80% { transform: translateX(5px); }
                    }

                    .shake-animation {
                        animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                    }

                    .glass-input {
                        transition: all 0.2s ease;
                    }
                    .glass-input:focus {
                        outline: none;
                        border-color: #F5E134;
                        box-shadow: 0 0 0 4px rgba(245, 225, 52, 0.15);
                        background-color: rgba(255, 255, 255, 0.1);
                    }
                    .glass-input::placeholder {
                        color: rgba(235, 235, 245, 0.4);
                    }

                    .glass-button {
                        transition: all 0.2s ease;
                    }
                    .glass-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(245, 225, 52, 0.4);
                    }
                    .glass-button:active {
                        transform: translateY(0);
                        box-shadow: 0 4px 10px rgba(245, 225, 52, 0.3);
                    }
                `}
            </style>

            {/* Lueur d'arrière-plan stylisée */}
            <div style={styles.glowBackground} />

            <div style={{ ...styles.card, ...(shake ? { animation: 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' } : {}) }}>
                <div style={styles.iconContainer}>
                    <FaHamburger size={32} color="#F5E134" />
                </div>

                <h2 style={styles.title}>Accès Réservé</h2>
                <p style={styles.subtitle}>Midnight Burger</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        className="glass-input"
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) setError(false);
                        }}
                        style={styles.input}
                        autoFocus
                    />

                    <div style={styles.errorContainer}>
                        {error && <p style={styles.errorText}>Mot de passe incorrect</p>}
                    </div>

                    <button type="submit" className="glass-button" style={styles.button}>
                        Déverrouiller
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: 'relative',
        overflow: 'hidden'
    },
    glowBackground: {
        position: 'absolute',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(245,225,52,0.15) 0%, rgba(0,0,0,0) 70%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
        pointerEvents: 'none'
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        padding: '20px',
        borderRadius: '32px',
        width: '80%',
        maxWidth: '380px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        zIndex: 1,
        boxSizing: 'border-box'
    },
    iconContainer: {
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px auto',
        border: '1px solid rgba(255, 255, 255, 0.2)',
    },
    icon: {
        fontSize: '32px',
    },
    title: {
        margin: '0 0 8px 0',
        color: '#FFFFFF',
        fontSize: '26px',
        fontWeight: 700,
        letterSpacing: '-0.5px'
    },
    subtitle: {
        color: 'rgba(235, 235, 245, 0.6)',
        margin: '0 0 30px 0',
        fontSize: '15px',
        fontWeight: 400
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    input: {
        padding: '16px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '#FFFFFF',
        fontSize: '16px',
        textAlign: 'center',
        letterSpacing: '2px', // Espacement pour les points du mot de passe
        fontFamily: "'Inter', sans-serif",
    },
    errorContainer: {
        height: '24px', // Hauteur fixe pour éviter que le bouton ne saute quand l'erreur apparaît
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '8px 0',
    },
    errorText: {
        color: '#FF453A', // Rouge iOS 
        margin: 0,
        fontSize: '14px',
        fontWeight: 600
    },
    button: {
        padding: '18px',
        backgroundColor: '#F5E134', // Jaune Premium
        color: '#000000',
        border: 'none',
        borderRadius: '16px',
        fontSize: '16px',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(245, 225, 52, 0.2)',
        fontFamily: "'Inter', sans-serif",
    }
};