import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { generateEventPlan, EventDetails } from '../services/ai';
import { useAuth } from '../context/AuthContext';

// Define an interface for Hall details
interface Hall {
  id: string;
  name: string;
  city: string;
  location: string;
  capacity: number;
  price: number; // Changed from string to number
  image: string;
}

// Define available time slots
const TIME_SLOTS = [
  "09:00 AM - 12:00 PM",
  "02:00 PM - 05:00 PM",
  "07:00 PM - 10:00 PM",
];

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
  const [functionHalls, setFunctionHalls] = useState<Hall[]>([]); // Use Hall interface
  // selectedHallForBooking is removed as booking now happens with date/time directly
  const [bookingConfirmationMessage, setBookingConfirmationMessage] = useState<string | null>(null);
  const { user } = useAuth(); // Get user from AuthContext

  // State to hold selected date and time slot for each hall
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<{ [hallId: string]: { date: string; timeSlot: string } }>({});
  const [currentEventCity, setCurrentEventCity] = useState<string | null>(null);


  // Expanded Mock Function Hall Data - Price updated to number
  const mockFunctionHalls: Hall[] = [
    // Mumbai
    { id: 'm1', name: 'The Sea View Banquet', city: 'Mumbai', location: 'Marine Lines', capacity: 300, price: 70000, image: 'https://via.placeholder.com/300x200.png?text=Sea+View+Mumbai' },
    { id: 'm2', name: 'Juhu Grand Hall', city: 'Mumbai', location: 'Juhu', capacity: 500, price: 120000, image: 'https://via.placeholder.com/300x200.png?text=Juhu+Grand' },
    { id: 'm3', name: 'Andheri Celebration Point', city: 'Mumbai', location: 'Andheri West', capacity: 200, price: 55000, image: 'https://via.placeholder.com/300x200.png?text=Andheri+Celeb' },
    { id: 'm4', name: 'Chembur Community Hall', city: 'Mumbai', location: 'Chembur', capacity: 150, price: 40000, image: 'https://via.placeholder.com/300x200.png?text=Chembur+Hall' },
    // Delhi
    { id: 'd1', name: 'Imperial Gardens', city: 'Delhi', location: 'Connaught Place', capacity: 600, price: 150000, image: 'https://via.placeholder.com/300x200.png?text=Imperial+Delhi' },
    { id: 'd2', name: 'The Royal Palace Hall', city: 'Delhi', location: 'Chanakyapuri', capacity: 400, price: 90000, image: 'https://via.placeholder.com/300x200.png?text=Royal+Palace+Delhi' },
    { id: 'd3', name: 'Saket Convention Center', city: 'Delhi', location: 'Saket', capacity: 700, price: 180000, image: 'https://via.placeholder.com/300x200.png?text=Saket+Convention' },
    { id: 'd4', name: 'Karol Bagh Community Hall', city: 'Delhi', location: 'Karol Bagh', capacity: 250, price: 60000, image: 'https://via.placeholder.com/300x200.png?text=Karol+Bagh+Hall' },
    // Bangalore
    { id: 'b1', name: 'Silicon Valley Convention', city: 'Bangalore', location: 'Electronic City', capacity: 1000, price: 200000, image: 'https://via.placeholder.com/300x200.png?text=Silicon+Valley+BLR' },
    { id: 'b2', name: 'Lalbagh Botanical Hall', city: 'Bangalore', location: 'Lalbagh Road', capacity: 350, price: 80000, image: 'https://via.placeholder.com/300x200.png?text=Lalbagh+Hall+BLR' },
    { id: 'b3', name: 'Indiranagar Social Club', city: 'Bangalore', location: 'Indiranagar', capacity: 180, price: 65000, image: 'https://via.placeholder.com/300x200.png?text=Indiranagar+Club' },
    { id: 'b4', name: 'Koramangala Banquet Hall', city: 'Bangalore', location: 'Koramangala', capacity: 450, price: 110000, image: 'https://via.placeholder.com/300x200.png?text=Koramangala+Banquet' },
    // Hyderabad
    { id: 'h1', name: 'Charminar Celebration Hall', city: 'Hyderabad', location: 'Old City', capacity: 300, price: 75000, image: 'https://via.placeholder.com/300x200.png?text=Charminar+Hall+HYD' },
    { id: 'h2', name: 'Hi-Tech City Convention', city: 'Hyderabad', location: 'HITEC City', capacity: 800, price: 190000, image: 'https://via.placeholder.com/300x200.png?text=HITEC+Convention' },
    { id: 'h3', name: 'Banjara Hills Royal Garden', city: 'Hyderabad', location: 'Banjara Hills', capacity: 500, price: 130000, image: 'https://via.placeholder.com/300x200.png?text=Banjara+Royal+HYD' },
    { id: 'h4', name: 'Gachibowli Community Center', city: 'Hyderabad', location: 'Gachibowli', capacity: 220, price: 50000, image: 'https://via.placeholder.com/300x200.png?text=Gachibowli+Center' },
  ];

  useEffect(() => {
    // Simulate fetching function hall data
    setFunctionHalls(mockFunctionHalls);
    // Initialize selectedBookingDetails for each hall
    const initialBookingDetails: { [hallId: string]: { date: string; timeSlot: string } } = {};
    mockFunctionHalls.forEach(hall => {
      initialBookingDetails[hall.id] = { date: '', timeSlot: TIME_SLOTS[0] }; // Default to first time slot
    });
    setSelectedBookingDetails(initialBookingDetails);
  }, [mockFunctionHalls]);

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
        setCurrentEventCity(eventDetails.location); // Set the current event city
        console.log(`[EventPlan.tsx] initializePlan: Event city set to: ${eventDetails.location}`);
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

  // Function to handle changes in date or time slot selection
  const handleBookingDetailChange = (hallId: string, field: 'date' | 'timeSlot', value: string) => {
    setSelectedBookingDetails(prev => ({
      ...prev,
      [hallId]: {
        ...prev[hallId],
        [field]: value,
      },
    }));
  };
  
  const handleBookHall = async (hall: Hall, date: string, timeSlot: string) => {
    if (!user) {
      alert('Please log in to book a hall.');
      // Optionally, redirect to login page
      // window.location.href = '/login'; 
      return;
    }

    if (!date) {
      alert('Please select a date for the booking.');
      return;
    }
    if (!timeSlot) {
      alert('Please select a time slot for the booking.');
      return;
    }

    setBookingConfirmationMessage('Processing your booking...');
    console.log(`[EventPlan.tsx] handleBookHall: Initiating booking for Hall ID: ${hall.id}, Date: ${date}, Time: ${timeSlot}`);

    const bookingData = {
      hallId: hall.id,
      hallName: hall.name,
      userId: user.id,
      userName: user.username,
      bookingDate: date,
      timeSlot: timeSlot,
      price: hall.price, // Assuming hall.price is the price for the slot
    };
    console.log('[EventPlan.tsx] handleBookHall: Booking data prepared:', bookingData);

    try {
      console.log('[EventPlan.tsx] handleBookHall: Attempting to POST /api/bookings');
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add Authorization header if your API requires it
          // 'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(bookingData),
      });
      console.log('[EventPlan.tsx] handleBookHall: Response status from /api/bookings:', response.status);

      const result = await response.json();
      console.log('[EventPlan.tsx] handleBookHall: Response JSON from /api/bookings:', result);

      if (response.ok) {
        setBookingConfirmationMessage(
          `Successfully booked ${hall.name} for ${date} (${timeSlot})! Your ticket is being downloaded.`
        );
        console.log('[EventPlan.tsx] handleBookHall: Booking successful. Result ID:', result.id);
        
        // Trigger PDF ticket download
        if (result.id) { // Assuming the backend returns the booking with an id
          console.log(`[EventPlan.tsx] handleBookHall: Triggering PDF download from /api/bookings/${result.id}/ticket`);
          window.open(`/api/bookings/${result.id}/ticket`, '_blank');
        } else {
          console.error('[EventPlan.tsx] handleBookHall: Booking successful, but no booking ID received for ticket download. Response:', result);
          setBookingConfirmationMessage(
            `Successfully booked ${hall.name}! Booking ID missing, cannot download ticket automatically.`
          );
        }
      } else {
        console.error('[EventPlan.tsx] handleBookHall: Booking failed. Status:', response.status, 'Result:', result);
        throw new Error(result.message || `Booking failed. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred during booking.';
      setBookingConfirmationMessage(`Booking failed: ${errorMessage}`);
    }

    // Clear message after some time
    setTimeout(() => {
      setBookingConfirmationMessage(null);
    }, 10000); // Increased timeout for user to read message
  };

  const displayedFunctionHalls = useMemo(() => {
    if (!currentEventCity) {
      return []; // Don't show any halls until city is known
    }
    const cityToFilter = currentEventCity.toLowerCase();
    console.log(`[EventPlan.tsx] Filtering halls for city: ${cityToFilter}`);
    const filtered = functionHalls.filter(hall => hall.city.toLowerCase() === cityToFilter);
    console.log(`[EventPlan.tsx] Found ${filtered.length} halls for ${cityToFilter}`);
    return filtered;
  }, [functionHalls, currentEventCity]);

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
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'transform 0.2s ease-in-out',
    // ':hover': { // This doesn't work directly in inline styles, handle with state or CSS classes if needed
    //   transform: 'scale(1.02)'
    // }
  };

  const bookButtonStyle: React.CSSProperties = {
    backgroundColor: '#4CAF50', // Green
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease-in-out',
    marginTop: '10px', // Added margin top for spacing
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px',
    margin: '5px 0 10px 0',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: 'calc(100% - 18px)', // Adjust width to fit padding and border
  };
  
  const labelStyle: React.CSSProperties = {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    marginBottom: '3px',
    display: 'block',
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
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#2D3748', marginBottom: '20px', textAlign: 'center' }}>
          Book Function Halls
        </h2>
        {bookingConfirmationMessage && (
          <div style={{ backgroundColor: '#C6F6D5', color: '#2F855A', padding: '10px', borderRadius: '5px', marginBottom: '20px', textAlign: 'center' }}>
            {bookingConfirmationMessage}
          </div>
        )}
        {displayedFunctionHalls.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {displayedFunctionHalls.map(hall => (
              <div key={hall.id} style={hallCardStyle}>
                {/* <img src={hall.image} alt={hall.name} style={hallImageStyle} /> */}
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '10px 0', color: '#4A5568' }}>{hall.name}</h3>
                <p style={{ margin: '4px 0' }}>City: {hall.city}</p>
                <p style={{ margin: '4px 0' }}>Location: {hall.location}</p>
                <p style={{ margin: '4px 0' }}>Capacity: {hall.capacity} guests</p>
                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Price: ₹{hall.price.toLocaleString()} /slot</p>
                
                {/* Date Picker */}
                <div>
                  <label htmlFor={`date-${hall.id}`} style={labelStyle}>Select Date:</label>
                  <input
                    type="date"
                    id={`date-${hall.id}`}
                    style={inputStyle}
                    value={selectedBookingDetails[hall.id]?.date || ''}
                    onChange={(e) => handleBookingDetailChange(hall.id, 'date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                  />
                </div>

                {/* Time Slot Selector */}
                <div>
                  <label htmlFor={`time-${hall.id}`} style={labelStyle}>Select Time Slot:</label>
                  <select
                    id={`time-${hall.id}`}
                    style={inputStyle}
                    value={selectedBookingDetails[hall.id]?.timeSlot || ''}
                    onChange={(e) => handleBookingDetailChange(hall.id, 'timeSlot', e.target.value)}
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
                
                <button 
                  style={bookButtonStyle} 
                  onClick={() => {
                    const details = selectedBookingDetails[hall.id];
                    if (details) {
                      handleBookHall(hall, details.date, details.timeSlot);
                    } else {
                      // Should not happen if initialized correctly
                      alert("Please select date and time.");
                    }
                  }}
                >
                  Book {hall.name}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center' }}>
            {isLoading ? 'Loading event plan and halls...' : 
              currentEventCity 
                ? `No function halls listed for ${currentEventCity} in our current mock data. Please check back later or expand our listings!`
                : 'Determining event city to filter halls...'}
          </p>
        )}
      </div>
    </div>
  );
};

export default EventPlan;
