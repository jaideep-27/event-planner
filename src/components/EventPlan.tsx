import React, { useEffect, useState, useRef, useCallback } from 'react';
import { generateEventPlan, EventDetails } from '../services/ai';
import { useAuth } from '../context/AuthContext';


const EventPlan = () => {
  // const [plan, setPlan] = useState<string>(''); // Removed unused 'plan' state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<boolean[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const effectRan = useRef(false); // Ref to track if useEffect has run for initial load

  // States for Function Hall Booking
  const [functionHalls, setFunctionHalls] = useState<any[]>([]);
  const [selectedHallForBooking, setSelectedHallForBooking] = useState<any | null>(null);
  const [bookingConfirmationMessage, setBookingConfirmationMessage] = useState<string | null>(null);
  const { user } = useAuth(); // Get user from AuthContext

  // Expanded Mock Function Hall Data
  const mockFunctionHalls = [
    // Mumbai
    { id: 'm1', name: 'The Sea View Banquet', city: 'Mumbai', location: 'Marine Lines', capacity: 300, price: '₹70,000/day', image: 'https://via.placeholder.com/300x200.png?text=Sea+View+Mumbai' },
    { id: 'm2', name: 'Juhu Grand Hall', city: 'Mumbai', location: 'Juhu', capacity: 500, price: '₹1,20,000/day', image: 'https://via.placeholder.com/300x200.png?text=Juhu+Grand' },
    { id: 'm3', name: 'Andheri Celebration Point', city: 'Mumbai', location: 'Andheri West', capacity: 200, price: '₹55,000/day', image: 'https://via.placeholder.com/300x200.png?text=Andheri+Celeb' },
    { id: 'm4', name: 'Chembur Community Hall', city: 'Mumbai', location: 'Chembur', capacity: 150, price: '₹40,000/day', image: 'https://via.placeholder.com/300x200.png?text=Chembur+Hall' },
    // Delhi
    { id: 'd1', name: 'Imperial Gardens', city: 'Delhi', location: 'Connaught Place', capacity: 600, price: '₹1,50,000/day', image: 'https://via.placeholder.com/300x200.png?text=Imperial+Delhi' },
    { id: 'd2', name: 'The Royal Palace Hall', city: 'Delhi', location: 'Chanakyapuri', capacity: 400, price: '₹90,000/day', image: 'https://via.placeholder.com/300x200.png?text=Royal+Palace+Delhi' },
    { id: 'd3', name: 'Saket Convention Center', city: 'Delhi', location: 'Saket', capacity: 700, price: '₹1,80,000/day', image: 'https://via.placeholder.com/300x200.png?text=Saket+Convention' },
    { id: 'd4', name: 'Karol Bagh Community Hall', city: 'Delhi', location: 'Karol Bagh', capacity: 250, price: '₹60,000/day', image: 'https://via.placeholder.com/300x200.png?text=Karol+Bagh+Hall' },
    // Bangalore
    { id: 'b1', name: 'Silicon Valley Convention', city: 'Bangalore', location: 'Electronic City', capacity: 1000, price: '₹2,00,000/day', image: 'https://via.placeholder.com/300x200.png?text=Silicon+Valley+BLR' },
    { id: 'b2', name: 'Lalbagh Botanical Hall', city: 'Bangalore', location: 'Lalbagh Road', capacity: 350, price: '₹80,000/day', image: 'https://via.placeholder.com/300x200.png?text=Lalbagh+Hall+BLR' },
    { id: 'b3', name: 'Indiranagar Social Club', city: 'Bangalore', location: 'Indiranagar', capacity: 180, price: '₹65,000/day', image: 'https://via.placeholder.com/300x200.png?text=Indiranagar+Club' },
    { id: 'b4', name: 'Koramangala Banquet Hall', city: 'Bangalore', location: 'Koramangala', capacity: 450, price: '₹1,10,000/day', image: 'https://via.placeholder.com/300x200.png?text=Koramangala+Banquet' },
    // Hyderabad
    { id: 'h1', name: 'Charminar Celebration Hall', city: 'Hyderabad', location: 'Old City', capacity: 300, price: '₹75,000/day', image: 'https://via.placeholder.com/300x200.png?text=Charminar+Hall+HYD' },
    { id: 'h2', name: 'Hi-Tech City Convention', city: 'Hyderabad', location: 'HITEC City', capacity: 800, price: '₹1,90,000/day', image: 'https://via.placeholder.com/300x200.png?text=HITEC+Convention' },
    { id: 'h3', name: 'Banjara Hills Royal Garden', city: 'Hyderabad', location: 'Banjara Hills', capacity: 500, price: '₹1,30,000/day', image: 'https://via.placeholder.com/300x200.png?text=Banjara+Royal+HYD' },
    { id: 'h4', name: 'Gachibowli Community Center', city: 'Hyderabad', location: 'Gachibowli', capacity: 220, price: '₹50,000/day', image: 'https://via.placeholder.com/300x200.png?text=Gachibowli+Center' },
  ];

  useEffect(() => {
    // Simulate fetching function hall data
    setFunctionHalls(mockFunctionHalls);
  }, []);


  const parseSections = (text: string) => {
    console.log("[EventPlan.tsx] parseSections - Input (first 100 chars):", text?.substring(0, 100));
    const normalizedText = text.replace(/\r\n/g, '\n').trim();
    const sectionMatches = normalizedText.match(/\d+\.\s+[^\n]*(?:\n(?!\d+\.\s+)[^\n]*)*/g) || [];
    const parsed = sectionMatches.map(section => {
      const lines = section.split('\n');
      const title = lines[0].replace(/^\d+\.\s+/, '');
      const content = lines.slice(1).join('\n').trim();
      return `${title}\n${content}`;
    });
    console.log("[EventPlan.tsx] parseSections - Output:", parsed);
    return parsed;
  };

  const generatePlan = useCallback(async (eventDetails: EventDetails) => {
    console.log(`[EventPlan.tsx] generatePlan called. Current retryCount: ${retryCount}`);
    try {
      if (retryCount === 0) { // Only set loading true on the very first attempt (not retries)
        console.log("[EventPlan.tsx] generatePlan: First attempt, setting isLoading to true.");
        setIsLoading(true);
        setError(null);
      }
      
      const generatedPlan = await generateEventPlan(eventDetails);
      console.log("[EventPlan.tsx] generatePlan: Received plan from ai.ts (first 200 chars):", generatedPlan?.substring(0, 200));
      
      if (!generatedPlan) {
        console.error("[EventPlan.tsx] generatePlan: Plan from ai.ts is null or empty.");
        throw new Error('No plan was generated from AI service');
      }

      // setPlan(generatedPlan); // Removed: 'plan' state is not used
      const splitSections = parseSections(generatedPlan);
      
      if (splitSections.length === 0) {
        console.error("[EventPlan.tsx] generatePlan: Parsed sections length is 0.");
        throw new Error('Failed to parse the generated plan into sections');
      }
      console.log("[EventPlan.tsx] generatePlan: Sections parsed successfully:", splitSections);

      setSections(splitSections);
      setOpenSections(new Array(splitSections.length).fill(true));
      setRetryCount(0); // Reset on success
      setIsLoading(false); // Explicitly set loading false
      console.log("[EventPlan.tsx] generatePlan: Successfully processed. isLoading set to false.");

    } catch (error) {
      const newRetryCount = retryCount + 1;
      console.error(`[EventPlan.tsx] generatePlan: Error on attempt ${newRetryCount}. Error:`, error);
      
      if (newRetryCount <= MAX_RETRIES) {
        setRetryCount(newRetryCount);
        console.log(`[EventPlan.tsx] generatePlan: Scheduling retry ${newRetryCount}/${MAX_RETRIES}.`);
        setTimeout(() => generatePlan(eventDetails), 2000);
      } else {
        console.error("[EventPlan.tsx] generatePlan: Max retries reached. Setting final error.");
        setError('Unable to generate event plan at the moment. Please try again later.');
        setIsLoading(false); // Set loading false on final failure
        setTimeout(() => {
          console.log("[EventPlan.tsx] generatePlan: Redirecting after max retries.");
          window.location.href = '/create-event';
        }, 3000);
      }
    }
  }, [retryCount]); // Added retryCount as a dependency for useCallback

  useEffect(() => {
    console.log("[EventPlan.tsx] useEffect: Fired.");
    // StrictMode guard for development to prevent double execution of initial API call
    if (process.env.NODE_ENV === 'development') {
      if (effectRan.current === true) {
        console.log("[EventPlan.tsx] useEffect: StrictMode re-render detected, skipping duplicate initialization.");
        return; // Skip second run in dev
      }
      effectRan.current = true;
    } 
    // Note: For production, or if not using StrictMode, this effectRan logic might be simplified or removed
    // if double-execution is solely a StrictMode development behavior.
    // If there's a possibility of this component re-mounting and re-running useEffect 
    // undesirably in production, then effectRan.current = true should be outside the dev check.
    // For now, this targets the common StrictMode double-invoke in dev.

    const initializePlan = async () => {
      console.log("[EventPlan.tsx] initializePlan: Starting.");
      try {
        const storedDetails = localStorage.getItem('eventDetails');
        if (!storedDetails) {
          console.error("[EventPlan.tsx] initializePlan: No eventDetails in localStorage. Redirecting.");
          window.location.href = '/create-event';
          return;
        }
        console.log("[EventPlan.tsx] initializePlan: Found eventDetails in localStorage.");

        const eventDetails: EventDetails = JSON.parse(storedDetails);
        if (!eventDetails.eventType || !eventDetails.location || !eventDetails.budget || !eventDetails.guestCount) {
          console.error("[EventPlan.tsx] initializePlan: Missing required event details in localStorage.");
          throw new Error('Missing required event details');
        }
        console.log("[EventPlan.tsx] initializePlan: Event details validated. Calling generatePlan.");
        await generatePlan(eventDetails);
      } catch (error) {
        console.error("[EventPlan.tsx] initializePlan: Error during initialization.", error);
        setError('Failed to initialize event plan. Please check details and try again.');
        setIsLoading(false);
        setTimeout(() => {
          console.log("[EventPlan.tsx] initializePlan: Redirecting to /create-event due to initialization error.");
          window.location.href = '/create-event';
        }, 3000);
      }
    };

    initializePlan();

  }, [generatePlan]); // Added generatePlan to the dependency array


  const toggleSection = (index: number) => {
    const newOpenSections = [...openSections];
    newOpenSections[index] = !newOpenSections[index];
    setOpenSections(newOpenSections);
  };

  const downloadPlan = () => {
    try {
      const formattedPlan = sections.map((section, index) => {
        const [title, ...content] = section.split('\n');
        return `${index + 1}. ${title}\n${content.join('\n')}\n`;
      }).join('\n');

      const element = document.createElement('a');
      const file = new Blob([formattedPlan], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `event-plan-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      alert('Failed to download the plan. Please try again.');
    }
  };

  const downloadOrderSummary = (hallDetails: any) => {
    const summaryContent = `
      Order Confirmation
      --------------------
      Hall Name: ${hallDetails.name}
      Location: ${hallDetails.location}
      Capacity: ${hallDetails.capacity}
      Price: ${hallDetails.price}
      Booked by: ${user?.username || 'Guest User'} 
      Booking Date: ${new Date().toLocaleDateString()}
      --------------------
      Thank you for your booking!
      This is a simulated booking confirmation.
    `;
    const blob = new Blob([summaryContent.trim()], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `order_summary_${hallDetails.name.replace(/\\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleBookHall = (hall: any) => {
    setSelectedHallForBooking(hall);
    setBookingConfirmationMessage(`Successfully booked ${hall.name}! Your order summary is being downloaded.`);
    downloadOrderSummary(hall);
    // Here you would typically also send this booking data to your backend to store in the user's profile.
    // For now, we're just showing a message and downloading a summary.
    setTimeout(() => setBookingConfirmationMessage(null), 7000); // Clear message after some time
  };

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '1.125rem', marginBottom: '1rem', color: '#e53e3e' }}>{error}</p>
          <p>Redirecting back to the form...</p>
        </div>
      </div>
    );
  }

  if (isLoading && sections.length === 0) { // Ensure loading is only for initial plan, not halls
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>
            Creating your perfect event plan...
          </p>
          <p style={{ marginTop: '0.5rem', color: '#666' }}>This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Inline styles for the new Function Hall section
  const hallCardStyle: React.CSSProperties = {
    border: '1px solid #E0E0E0', // Lighter border
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)', // Softer shadow
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: '#566573' // General text color for card content
  };

  const hallImageStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '300px',
    height: 'auto',
    borderRadius: '4px',
    marginBottom: '12px'
  };
  
  const bookButtonStyle: React.CSSProperties = {
    backgroundColor: '#76D7C4', // New primary teal
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    marginTop: '10px'
  };

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h1 className="gradient-text" style={{ fontSize: '2rem' }}>
            Your Event Plan
          </h1>
          <div className="flex" style={{ gap: '1rem' }}>
            <button className="button button-secondary" onClick={() => window.location.href = '/'}>
              Home
            </button>
            <button className="button" onClick={downloadPlan}>
              Download Plan
            </button>
          </div>
        </div>

        {sections.length > 0 ? (
          <div className="accordion">
            {sections.map((section, index) => {
              const [title, ...content] = section.split('\n');
              return (
                <div key={index} className="accordion-item">
                  <button
                    className="accordion-button"
                    onClick={() => toggleSection(index)}
                  >
                    <span className="section-number">{index + 1}.</span>
                    <span className="section-title">{title}</span>
                    <span 
                      className="section-arrow"
                      style={{ 
                        transform: `rotate(${openSections[index] ? 180 : 0}deg)`,
                        transition: 'transform 0.2s'
                      }}
                    >
                      ▼
                    </span>
                  </button>
                  {openSections[index] && (
                    <div className="accordion-content">
                      {content.map((line, i) => (
                        <p key={i} style={{ marginBottom: '0.5rem' }}>
                          {line.trim()}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          !isLoading && <p>No event plan sections to display. Try creating a new plan.</p>
        )}

        <button
          className="button w-full mt-4"
          onClick={() => window.location.href = '/create-event'}
        >
          Create Another Event Plan
        </button>
      </div>

      {/* New Function Hall Booking Section */}
      <div className="card" style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '20px', color: '#566573', textAlign: 'center' }}>
          Book Function Halls
        </h2>
        
        {bookingConfirmationMessage && (
          <div style={{ padding: '12px 15px', backgroundColor: '#E8F8F5', border: '1px solid #A3E4D7', borderRadius: '4px', color: '#1E8449', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
            {bookingConfirmationMessage}
          </div>
        )}

        {functionHalls.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {functionHalls.map(hall => (
              <div key={hall.id} style={hallCardStyle}>
                {/* <img src={hall.image} alt={hall.name} style={hallImageStyle} /> */}
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '10px 0', color: '#4A5568' }}>{hall.name}</h3> {/* Slightly darker for heading */}
                <p style={{ margin: '4px 0' }}>City: {hall.city}</p>
                <p style={{ margin: '4px 0' }}>Location: {hall.location}</p>
                <p style={{ margin: '4px 0' }}>Capacity: {hall.capacity} guests</p>
                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Price: {hall.price}</p>
                <button style={bookButtonStyle} onClick={() => handleBookHall(hall)}>
                  Book {hall.name}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center' }}>No function halls available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default EventPlan;
