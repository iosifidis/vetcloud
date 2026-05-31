import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TenantContext = createContext(null);

// Get the base API URL (handles both dev and prod)
const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
};

export const TenantProvider = ({ children }) => {
    const [tenantSettings, setTenantSettings] = useState({
        clinicName: '',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        logoUrl: '',
        enabledModules: ['appointments', 'clients', 'patients', 'records', 'users']
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const API_BASE_URL = getApiBaseUrl();
            // Note: We use raw axios here because this runs before login and doesn't need auth
            // The backend tenant middleware will extract the tenant from the Host header
            const response = await axios.get(`${API_BASE_URL}/tenant/settings`);
            
            if (response.data) {
                setTenantSettings(response.data);
                applyTheme(response.data);
            }
        } catch (err) {
            console.error("Failed to load tenant settings:", err);
            // If it's a 400/404, it might mean the tenant doesn't exist
            setError("Το ιατρείο δεν βρέθηκε ή δεν είναι ενεργό.");
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (settings) => {
        const root = document.documentElement;
        if (settings.primaryColor) {
            root.style.setProperty('--color-primary', settings.primaryColor);
        }
        if (settings.secondaryColor) {
            root.style.setProperty('--color-secondary', settings.secondaryColor);
        }
        if (settings.clinicName) {
            document.title = `${settings.clinicName} - VetCloud`;
        } else {
            document.title = `VetCloud`;
        }
    };

    // Update settings (called by the Admin from TenantSettingsPage)
    const updateSettings = (newSettings) => {
        setTenantSettings(newSettings);
        applyTheme(newSettings);
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // Helper to check if a module is enabled
    const isModuleEnabled = (moduleName) => {
        return tenantSettings.enabledModules.includes(moduleName);
    };

    const value = {
        settings: tenantSettings,
        loading,
        error,
        updateSettings,
        isModuleEnabled,
        fetchSettings
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
