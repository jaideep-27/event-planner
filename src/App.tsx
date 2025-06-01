import React from 'react';
import Home from './components/Home';
import EventForm from './components/EventForm';
import EventPlan from './components/EventPlan';

function App() {
  // Simple routing based on window.location.pathname
  const path = window.location.pathname;

  return (
    <div className="indian-pattern">
      {path === '/' && <Home />}
      {path === '/create-event' && <EventForm />}
      {path === '/event-plan' && <EventPlan />}
    </div>
  );
}

export default App;
