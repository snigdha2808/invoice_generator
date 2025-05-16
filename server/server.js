const express = require('express');
const connectDB = require('./db');
const cors = require('cors');
require('dotenv').config();
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');

const app = express();

// Init Middleware
app.use(cors()); 
app.use(express.json({ extended: false })); 

async function startServer() {
    await connectDB(); 

    // Configure Nodemailer Transporter
    let emailTransporter;
    if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        emailTransporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT, 10),
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER, // SMTP username
                pass: process.env.EMAIL_PASS, // SMTP password
            },
            tls: {
                // do not fail on invalid certs if developing locally
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
        });
        console.log('Nodemailer transporter configured with provided SMTP credentials.');
    } else {
        // Fallback to Ethereal for testing if SMTP credentials are not fully provided
        console.warn('SMTP credentials not fully provided in .env. Falling back to Ethereal Email for testing.');
        try {
            const testAccount = await nodemailer.createTestAccount();
            emailTransporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass, // generated ethereal password
                },
            });
            console.log('Nodemailer transporter configured with Ethereal. Preview URL: %s', nodemailer.getTestMessageUrl({ generatedMessage: true, user: testAccount.user, pass: testAccount.pass }));
        } catch (err) {
            console.error('Failed to create an Ethereal test account or transporter:', err);
            emailTransporter = null; // Ensure transporter is null if setup fails
        }
    }

    app.set('emailTransporter', emailTransporter); // Make transporter accessible in routes

    // Initialize Razorpay
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        app.set('razorpay', razorpayInstance);
        console.log('Razorpay instance initialized.');
    } else {
        console.warn('Razorpay KEY_ID or KEY_SECRET not found in .env. Razorpay integration will not be available.');
    }

    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}

startServer();

app.get('/', (req, res) => res.send('Invoice API Running'));

// Define Routes
const invoiceRoutes = require('./routes/invoices');
const authRoutes = require('./routes/auth');
const templateRoutes = require('./routes/templates');
const razorpayRoutes = require('./routes/razorpayRoutes');

app.use('/api/invoices', invoiceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/razorpay', razorpayRoutes);
