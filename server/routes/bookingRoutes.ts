import express, { Request, Response } from 'express';
import { Booking } from '../models/Booking'; // Assuming Booking.ts is in ../models
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const router = express.Router();

// This will store bookings in memory. In a real app, use a database.
const bookings: Booking[] = [];

// POST /api/bookings - Create a new booking
router.post('/', (req: Request, res: Response) => {
  console.log('[bookingRoutes.ts] POST /api/bookings: Received request');
  console.log('[bookingRoutes.ts] Request body:', req.body);
  try {
    const { hallId, hallName, userId, userName, bookingDate, timeSlot, price } = req.body;

    if (!hallId || !hallName || !userId || !bookingDate || !timeSlot || price === undefined) {
      console.error('[bookingRoutes.ts] Validation Error: Missing required booking information.', req.body);
      return res.status(400).json({ message: 'Missing required booking information.' });
    }

    const bookingDateObj = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

    if (bookingDateObj < today) {
        console.error('[bookingRoutes.ts] Validation Error: Booking date cannot be in the past.', { bookingDate });
        return res.status(400).json({ message: 'Booking date cannot be in the past.' });
    }

    // TODO: Add validation to check if the hall is already booked for the given date and time slot
    const existingBooking = bookings.find(b => 
      b.hallId === hallId && 
      b.bookingDate === bookingDate && 
      b.timeSlot === timeSlot
    );
    if (existingBooking) {
      console.warn('[bookingRoutes.ts] Conflict: Selected time slot is not available.', { hallId, bookingDate, timeSlot });
      return res.status(409).json({ message: 'This time slot is already booked for the selected hall and date. Please choose another.' });
    }

    const newBooking: Booking = {
      id: uuidv4(),
      hallId,
      hallName,
      userId,
      userName: userName || 'N/A',
      bookingDate,
      timeSlot,
      price,
      bookedAt: new Date(),
      paymentStatus: 'pending', // Default payment status
    };

    bookings.push(newBooking);
    console.log('[bookingRoutes.ts] New booking created successfully:', newBooking);
    console.log('[bookingRoutes.ts] Current total bookings in memory:', bookings.length);

    // Respond with the created booking object, including its new ID
    res.status(201).json(newBooking);

  } catch (error) {
    console.error('[bookingRoutes.ts] POST /api/bookings - Internal Server Error:', error);
    res.status(500).json({ message: 'Error creating booking', error: (error as Error).message });
  }
});

// GET /api/bookings/:bookingId/ticket - Download ticket (placeholder)
router.get('/:bookingId/ticket', (req: Request, res: Response) => {
  const { bookingId } = req.params;
  console.log(`[bookingRoutes.ts] GET /api/bookings/${bookingId}/ticket: Received request`);
  const booking = bookings.find(b => b.id === bookingId);

  if (!booking) {
    console.error(`[bookingRoutes.ts] Booking not found for ID: ${bookingId}`);
    return res.status(404).json({ message: 'Booking not found.' });
  }
  console.log('[bookingRoutes.ts] Found booking for ticket generation:', booking);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=ticket_${booking.id}.pdf`);
  
  // Placeholder for PDF content - In a real app, use a library like PDFKit
  const pdfPlaceholderContent = `
    TICKET CONFIRMATION
    ---------------------
    Booking ID: ${booking.id}
    Hall: ${booking.hallName}
    Date: ${booking.bookingDate}
    Time: ${booking.timeSlot}
    Price: ${booking.price}
    Booked By: ${booking.userName}
    Booked At: ${booking.bookedAt.toLocaleString()}
    ---------------------
    This is a placeholder PDF ticket.
  `;
  
  // To simulate a PDF stream for now, let's use pdfkit if available, else simple text
  try {
    console.log('[bookingRoutes.ts] Attempting to generate PDF with pdfkit.');
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Pipe its output to the response
    doc.pipe(res);
    
    // Add content to the PDF
    doc.fontSize(25).text('Ticket Confirmation', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Booking ID: ${booking.id}`);
    doc.text(`Hall: ${booking.hallName}`);
    doc.text(`Date: ${booking.bookingDate}`);
    doc.text(`Time Slot: ${booking.timeSlot}`);
    doc.text(`Price: Rs. ${booking.price.toLocaleString()}`);
    doc.text(`Booked By: ${booking.userName || booking.userId}`);
    doc.text(`Booked At: ${booking.bookedAt.toLocaleString()}`);
    doc.moveDown();
    doc.text('Thank you for your booking!', {align: 'center'});
    
    console.log('[bookingRoutes.ts] PDF content added. Finalizing document.');
    // Finalize PDF file
    doc.end();
    console.log('[bookingRoutes.ts] PDF generated and stream ended successfully.');

  } catch (e) {
    console.error("[bookingRoutes.ts] Error during PDF generation with pdfkit:", e);
    console.warn("[bookingRoutes.ts] pdfkit not found or error during use. Run 'npm install pdfkit' or 'yarn add pdfkit' in the project root (if not already done for server). Sending plain text for ticket.")
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=ticket_${booking.id}.txt`);
    res.send(pdfPlaceholderContent);
  }
});

export default router; 