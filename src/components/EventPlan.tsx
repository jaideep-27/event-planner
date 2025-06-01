import React, { useEffect, useState, useRef, useCallback } from 'react';
import { generateEventPlan, EventDetails } from '../services/ai';


const EventPlan = () => {
  // const [plan, setPlan] = useState<string>(''); // Removed unused 'plan' state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<boolean[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const effectRan = useRef(false); // Ref to track if useEffect has run for initial load

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

  if (isLoading) {
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

  return (
    <div className="container">
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

        <button
          className="button w-full mt-4"
          onClick={() => window.location.href = '/create-event'}
        >
          Create Another Event Plan
        </button>
      </div>
    </div>
  );
};

export default EventPlan;
