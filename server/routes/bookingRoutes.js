"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid"); // For generating unique IDs
const router = express_1.default.Router();
// This will store bookings in memory. In a real app, use a database.
const bookings = [];
// POST /api/bookings - Create a new booking
router.post('/', (req, res) => {
    try {
        const { hallId, hallName, userId, userName, bookingDate, timeSlot, price } = req.body;
        if (!hallId || !hallName || !userId || !bookingDate || !timeSlot || price === undefined) {
            return res.status(400).json({ message: 'Missing required booking information.' });
        }
        // Basic validation for date (ensure it's not in the past, etc. - can be more robust)
        if (new Date(bookingDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
            return res.status(400).json({ message: 'Booking date cannot be in the past.' });
        }
        // TODO: Add validation to check if the hall is already booked for the given date and time slot
        // This would involve checking the 'bookings' array (or database) for conflicts.
        // For example:
        // const existingBooking = bookings.find(b => 
        //   b.hallId === hallId && 
        //   b.bookingDate === bookingDate && 
        //   b.timeSlot === timeSlot
        // );
        // if (existingBooking) {
        //   return res.status(409).json({ message: 'Selected time slot is not available.' });
        // }
        const newBooking = {
            id: (0, uuid_1.v4)(),
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
        console.log('New booking created:', newBooking);
        console.log('All bookings:', bookings);
        // Respond with the created booking object, including its new ID
        res.status(201).json(newBooking);
    }
    catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Error creating booking', error: error.message });
    }
});
// GET /api/bookings/:bookingId/ticket - Download ticket (placeholder)
router.get('/:bookingId/ticket', (req, res) => {
    const { bookingId } = req.params;
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) {
        return res.status(404).json({ message: 'Booking not found.' });
    }
    // TODO: Implement PDF generation logic here
    // For now, send a simple text confirmation
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
    // Instead of res.send, you would pipe a PDF stream from a library like PDFKit
    // Example with a simple text response that mimics a PDF for now:
    // res.send(pdfPlaceholderContent);
    // To simulate a PDF stream for now, let's use pdfkit if available, else simple text
    try {
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
        doc.text('Thank you for your booking!', { align: 'center' });
        // Finalize PDF file
        doc.end();
    }
    catch (e) {
        console.warn("pdfkit not found, sending plain text for ticket. Run 'npm install pdfkit' or 'yarn add pdfkit' in server directory.");
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=ticket_${booking.id}.txt`);
        res.send(pdfPlaceholderContent);
    }
});
exports.default = router;
//# sourceMappingURL=bookingRoutes.js.map