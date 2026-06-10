"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import NotificationDropdown from "./NotificationDropdown";
import UserMenu from "./UserMenu";
import CreateRewardModal from "@/components/rewards/CreateRewardModal";
import GivePointsModal from "@/components/rewards/GivePointsModal";
import CustomerRewardsModal from "@/components/rewards/CustomerRewardsModal";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  const [showCreateReward, setShowCreateReward] = useState(false);
  const [showGivePoints, setShowGivePoints] = useState(false);
  const [showCustomerRewards, setShowCustomerRewards] = useState(false);
  
  const isAdmin = user?.role === "admin";
  const isBusiness = user?.role === "business";
  const showRoleIcon = user?.role === "client" || isBusiness;
  const title = isAdmin ? "Centro de Operaciones" : isBusiness ? "Area de negocio" : "Area de usuario";

  return (
    <header 
      className="admin-header" 
      style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "16px 24px",
        boxSizing: "border-box"
      }}
    >
      {/* SECCIÓN IZQUIERDA: Icono + Bloque de textos combinados */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        
        {/* El icono ocupa exactamente el alto total del bloque de texto */}
        {showRoleIcon && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Image
              src="/favicon.ico"
              alt=""
              width={40} 
              height={40}
              aria-hidden="true"
              style={{ 
                width: "auto", 
                height: "36px", // Ajustado para que visualmente abarque las dos líneas de texto
                objectFit: "contain", 
                flex: "0 0 auto" 
              }}
            />
          </div>
        )}
        
        {/* Bloque de textos con distribución controlada */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "space-between",
          alignItems: "stretch" // Fuerza a los hijos directos a estirarse horizontalmente
        }}>
          <h1 
            className="admin-header__title" 
            style={{ 
              fontSize: "16px", 
              fontWeight: 800, 
              textTransform: "uppercase", 
              letterSpacing: "0.05em", 
              color: "var(--muted)",
              margin: 0,
              lineHeight: "1.1",
              display: "flex",
              justifyContent: "space-between" // Si hay espacio extra, distribuye las letras/palabras
            }}
          >
            {/* Mapeamos el título en caracteres si quisiéramos un justify perfecto, 
                pero con flex-start o empuje se controla el final */}
            <span style={{ display: "block", width: "100%" }}>{title}</span>
          </h1>
          
          <p 
            className="admin-header__subtitle" 
            style={{ 
              fontSize: "14px", 
              fontWeight: 600, 
              color: "var(--text)", 
              margin: 0, 
              marginTop: "2px",
              lineHeight: "1.1",
              whiteSpace: "nowrap",
              display: "block"
            }}
          >
            {isAdmin ? "Panel de Control Administrativo" : isBusiness ? "Reservas y actividad reciente" : "Reservas y comercios disponibles"}
          </p>
        </div>
      </div>

      {/* SECCIÓN DERECHA: Botones de acción */}
      <div 
        className="admin-header__actions" 
        style={{ display: "flex", alignItems: "center", gap: "16px", overflow: "visible" }}
      >
        {isBusiness && (
          <>
            <button
              onClick={() => setShowCreateReward(true)}
              className="theme-toggle-btn"
              style={{
                display: "grid",
                placeItems: "center",
                width: "42px",
                height: "42px",
                padding: 0,
                borderRadius: "12px",
                border: "1.5px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              title="Crear Recompensa"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            
            <button
              onClick={() => setShowGivePoints(true)}
              className="theme-toggle-btn"
              style={{
                display: "grid",
                placeItems: "center",
                width: "42px",
                height: "42px",
                padding: 0,
                borderRadius: "12px",
                border: "1.5px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              title="Asignar Puntos"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                <path d="M12 18V6"/>
              </svg>
            </button>
          </>
        )}

        {user?.role === "client" && (
          <button
            onClick={() => setShowCustomerRewards(true)}
            className="theme-toggle-btn"
            style={{
              display: "grid",
              placeItems: "center",
              width: "42px",
              height: "42px",
              padding: 0,
              borderRadius: "12px",
              border: "1.5px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            title="Mis Recompensas"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12"></polyline>
              <rect x="2" y="7" width="20" height="5"></rect>
              <line x1="12" y1="22" x2="12" y2="7"></line>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
            </svg>
          </button>
        )}

        {(isAdmin || isBusiness) && <NotificationDropdown />}
        
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          style={{
            display: "grid",
            placeItems: "center",
            width: "42px",
            height: "42px",
            padding: 0,
            borderRadius: "12px",
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          title={theme === "light" ? "Modo Oscuro" : "Modo Claro"}
        >
          {theme === "light" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>
        
        <div style={{ width: "1px", height: "24px", background: "var(--border)" }}></div>
        <UserMenu />
      </div>

      {/* MODALES */}
      {showCreateReward && (
        <CreateRewardModal
          onClose={() => setShowCreateReward(false)}
          onSuccess={() => {
            alert("Recompensa creada con éxito");
          }}
        />
      )}

      {showGivePoints && (
        <GivePointsModal
          onClose={() => setShowGivePoints(false)}
          onSuccess={() => {
            alert("Puntos asignados con éxito");
          }}
        />
      )}

      {showCustomerRewards && (
        <CustomerRewardsModal
          onClose={() => setShowCustomerRewards(false)}
        />
      )}
    </header>
  );
}
