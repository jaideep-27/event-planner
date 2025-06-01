import React from 'react';

const Home = () => {
  const navigate = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="container">
      <div className="flex" style={{ minHeight: '80vh', alignItems: 'center' }}>
        <div className="flex flex-col" style={{ flex: 1 }}>
          <h1 className="gradient-text" style={{ fontSize: '3rem', lineHeight: 1.2, marginBottom: '1.5rem' }}>
            Create Memorable Indian Events with AI-Powered Planning
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>
            From weddings to corporate events, let our AI help you plan the perfect celebration that embraces Indian culture and traditions.
          </p>
          <button className="button" onClick={() => navigate('/create-event')}>
            Start Planning Your Event
          </button>
        </div>
        
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            bottom: '-20px',
            left: '-20px',
            background: '#fff3e6',
            borderRadius: '16px',
            transform: 'rotate(3deg)'
          }} />
          <img
            src="https://images.unsplash.com/photo-1595407753234-0882f1e77954?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
            alt="Indian celebration"
            style={{
              width: '100%',
              borderRadius: '12px',
              position: 'relative',
              objectFit: 'cover'
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', color: '#333', marginBottom: '3rem' }}>
          Why Choose Our Event Planner?
        </h2>
        
        <div className="grid">
          {[
            {
              title: 'AI-Powered Planning',
              description: 'Get instant, personalized event plans tailored to your preferences and budget'
            },
            {
              title: 'Indian Culture Focus',
              description: 'Designs and suggestions that respect and celebrate Indian traditions'
            },
            {
              title: 'Budget Optimization',
              description: 'Smart allocation of resources to make the most of your budget'
            }
          ].map((feature, index) => (
            <div key={index} className="feature-card">
              <h3 className="feature-title">{feature.title}</h3>
              <p style={{ color: '#666' }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home; 