import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import EventForm from './components/EventForm';
import EventPlan from './components/EventPlan';
import SignupPage from './pages/Auth/SignupPage';
import SigninPage from './pages/Auth/SigninPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css'; // Assuming you still want this for the pattern

function App() {
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div className="indian-pattern" style={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signin" element={<SigninPage />} />

          {/* Protected Routes */}
          <Route 
            path="/create-event" 
            element={(
              <ProtectedRoute>
                <EventForm />
              </ProtectedRoute>
            )} 
          />
          <Route 
            path="/event-plan" 
            element={(
              <ProtectedRoute>
                <EventPlan />
              </ProtectedRoute>
            )} 
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
