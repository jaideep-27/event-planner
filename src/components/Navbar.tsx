import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
// import {
//     Box,
//     Flex,
//     Link,
//     Button,
//     Text,
//     Spacer,
//     Heading
// } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
    const { isAuthenticated, user, logout, isLoading } = useAuth();

    if (isLoading) {
        return null; // Or a loading spinner
    }

    return (
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '1.5rem', backgroundColor: '#76D7C4', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '1.25rem' }}>
                <h1 style={{ fontSize: '1.5rem', letterSpacing: '-0.1rem', fontWeight: 'bold' }}>
                    <RouterLink to="/" style={{ textDecoration: 'none', color: 'white' }}>
                        EventPlanner
                    </RouterLink>
                </h1>
            </div>

            <div style={{ flexGrow: 1 }} /> {/* Spacer */}

            <div>
                {isAuthenticated && user ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '1rem' }}>Welcome, {user.username}!</span>
                        <button onClick={logout} style={{ padding: '0.5rem 1rem', backgroundColor: 'transparent', border: '1px solid white', color: 'white', cursor: 'pointer' }}>
                            Logout
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <RouterLink to="/signin" style={{ textDecoration: 'none', color: 'white', marginRight: '1.5rem' }}>
                            Sign In
                        </RouterLink>
                        <RouterLink to="/signup" style={{ textDecoration: 'none', color: 'white' }}>
                            Sign Up
                        </RouterLink>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar; 