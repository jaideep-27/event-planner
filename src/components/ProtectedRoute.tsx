import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        // Show a loading spinner while checking auth status
        return (
            <div>Loading...</div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to the signin page if not authenticated
        return <Navigate to="/signin" replace />;
    }

    return <>{children}</>; // Render the children (the protected page)
};

export default ProtectedRoute; 