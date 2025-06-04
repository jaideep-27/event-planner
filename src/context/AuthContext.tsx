import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
    token: string | null;
    user: { id: string; username: string; email: string } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, userData: { id: string; username: string; email: string }) => void;
    signup: (token: string, userData: { id: string; username: string; email: string }) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<{ id: string; username: string; email: string } | null>(JSON.parse(localStorage.getItem('user') || 'null'));
    const [isLoading, setIsLoading] = useState(true); // To check initial auth status
    const navigate = useNavigate();

    useEffect(() => {
        // On initial load, check if token and user exist in localStorage
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setUser(null);
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, userData: { id: string; username: string; email: string }) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        navigate('/'); // Navigate to home/dashboard after login
    };

    const signup = (newToken: string, userData: { id: string; username: string; email: string }) => {
        // Similar to login, but you might want to navigate to signin or directly log them in
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        // For now, navigate to home. Consider navigating to a profile setup or a specific welcome page.
        navigate('/'); 
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        navigate('/signin'); // Navigate to signin page after logout
    };

    return (
        <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, isLoading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 