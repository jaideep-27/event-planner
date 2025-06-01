import React, { useState } from 'react';
import { EventDetails } from '../services/ai';

const EventForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EventDetails>({
    eventType: '',
    location: '',
    budget: 100000,
    guestCount: 100,
    preferences: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      localStorage.setItem('eventDetails', JSON.stringify(formData));
      window.location.href = '/event-plan';
    } catch (error) {
      alert('Failed to process your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
          Tell Us About Your Event
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Event Type</label>
            <select
              className="form-select"
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              required
            >
              <option value="">Select event type</option>
              <option value="Wedding">Wedding</option>
              <option value="Birthday Party">Birthday Party</option>
              <option value="Corporate Event">Corporate Event</option>
              <option value="Religious Ceremony">Religious Ceremony</option>
              <option value="Anniversary">Anniversary</option>
              <option value="Baby Shower">Baby Shower</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter city name"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Budget (in INR)</label>
            <input
              type="number"
              className="form-input"
              min={10000}
              max={10000000}
              step={10000}
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Number of Guests</label>
            <input
              type="number"
              className="form-input"
              min={10}
              max={1000}
              value={formData.guestCount}
              onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Additional Preferences</label>
            <textarea
              className="form-textarea"
              placeholder="Enter any specific preferences (e.g., vegetarian food only, specific color theme, etc.)"
              value={formData.preferences}
              onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="button w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div className="spinner" style={{ width: '20px', height: '20px' }} />
                <span>Generating Plan...</span>
              </div>
            ) : (
              'Generate Event Plan'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EventForm; 