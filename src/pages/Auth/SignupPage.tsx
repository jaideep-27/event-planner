import React, { useState } from 'react';
// import {
//     Box,
//     Button,
//     FormControl,
//     FormLabel,
//     Input,
//     Heading,
//     VStack,
//     useToast,
//     Text,
//     Link as ChakraLink
// } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SignupPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null); // For success messages
    // const toast = useToast(); 
    const auth = useAuth();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to sign up');
            }

            // toast({
            //     title: "Account created.",
            //     description: "We've created your account for you.",
            //     status: "success",
            //     duration: 5000,
            //     isClosable: true,
            // });
            setSuccessMessage("Account created successfully! We've created your account for you.");
            
            auth.signup(data.token, data.user);

            setUsername('');
            setEmail('');
            setPassword('');

        } catch (err: any) {
            console.error('Signup error:', err);
            const errorMessage = err.message || 'An unexpected error occurred.';
            setError(errorMessage);
            // toast({
            //     title: "Signup Failed.",
            //     description: errorMessage,
            //     status: "error",
            //     duration: 5000,
            //     isClosable: true,
            // });
        } finally {
            setIsLoading(false);
        }
    };

    // Basic styles - consider moving to a CSS file
    const pageStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 60px)', // Assuming navbar height is around 60px
        padding: '20px',
    };

    const formStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        border: '1px solid #E0E0E0', // Lighter border
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // Softer shadow
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
    };

    const inputStyle: React.CSSProperties = {
        padding: '0.75rem',
        border: '1px solid #CFD8DC', // Softer border
        borderRadius: '4px',
        fontSize: '1rem',
        color: '#566573' // Input text color
    };
    
    const buttonStyle: React.CSSProperties = {
        padding: '0.75rem',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#76D7C4', // New primary teal
        color: 'white',
        fontSize: '1rem',
        cursor: 'pointer',
        fontWeight: 'bold',
    };

     const errorStyle: React.CSSProperties = {
        color: '#DC3545', // Clear red
        textAlign: 'center',
        fontSize: '0.875rem',
        marginBottom: '1rem',
    };

    const successStyle: React.CSSProperties = {
        color: '#28A745', // Clear green
        textAlign: 'center',
        fontSize: '0.875rem',
        marginBottom: '1rem',
    };

    const labelStyle: React.CSSProperties = { 
        display: 'block', 
        marginBottom: '0.5rem', 
        color: '#566573', // Softer label text
        fontWeight: '500'
    };

    return (
        <div style={pageStyle}>
            <form onSubmit={handleSubmit} style={formStyle}>
                <h1 style={{ fontSize: '1.75rem', textAlign: 'center', marginBottom: '1.5rem', color: '#566573' }}>Sign Up</h1>
                
                <div>
                    <label htmlFor="username" style={labelStyle}>Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username"
                        required
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label htmlFor="email" style={labelStyle}>Email address</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        style={inputStyle}
                    />
                </div>

                <div>
                    <label htmlFor="password" style={labelStyle}>Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password (min. 6 characters)"
                        required
                        style={inputStyle}
                    />
                </div>

                {error && (
                    <div style={errorStyle}>
                        {error.split(',').map((msg, idx) => (
                            <div key={idx}>{msg.trim()}</div>
                        ))}
                    </div>
                )}

                {successMessage && (
                    <div style={successStyle}>
                        {successMessage}
                    </div>
                )}

                <button type="submit" style={buttonStyle} disabled={isLoading}>
                    {isLoading ? 'Signing Up...' : 'Sign Up'}
                </button>

                <p style={{ textAlign: 'center', marginTop: '0.5rem', color: '#566573' }}>
                    Already have an account?{' '}
                    <RouterLink to="/signin" style={{ color: '#5DAB9A', fontWeight: 'bold', textDecoration: 'underline' }}>
                        Sign In
                    </RouterLink>
                </p>
            </form>
        </div>
    );
};

export default SignupPage; 