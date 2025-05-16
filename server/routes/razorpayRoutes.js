const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Invoice = require('../models/Invoice'); // Import Invoice model
const razorpay = require('razorpay'); // Import Razorpay

// Initialize Razorpay instance (ensure keys are in .env)
let instance;
try {
  instance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('Razorpay instance initialized.');
} catch (error) {
  console.error('Failed to initialize Razorpay instance:', error);
  // Handle initialization error appropriately, perhaps by preventing routes from being used
}

// Route to create a Razorpay order
router.post('/orders', async (req, res) => {
    try {
        if (!instance) {
            return res.status(500).json({ message: 'Razorpay service not initialized.' });
        }
        const { amount, currency, receipt } = req.body;
        const options = {
            amount: amount * 100, // amount in the smallest currency unit (e.g., paise for INR)
            currency,
            receipt,
        };
        const order = await instance.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ message: 'Failed to create Razorpay order', error: error.message });
    }
});

// Route to verify payment signature
router.post('/verify', async (req, res) => { // Made async
    try {
        const { order_id, payment_id, signature } = req.body;
        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!order_id || !payment_id || !signature) {
            return res.status(400).json({ message: 'Missing required parameters for verification' });
        }
        if (!razorpaySecret) {
            console.error('RAZORPAY_KEY_SECRET is not set in .env');
            return res.status(500).json({ message: 'Razorpay key secret not configured' });
        }
        if (!instance) {
            return res.status(500).json({ message: 'Razorpay service not initialized for fetching order.' });
        }

        const hmac = crypto.createHmac('sha256', razorpaySecret);
        hmac.update(`${order_id}|${payment_id}`);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature === signature) {
            // Payment is successful and verified
            const orderDetails = await instance.orders.fetch(order_id);
            if (!orderDetails || !orderDetails.receipt) {
                console.error('Failed to fetch order details or receipt missing for order_id:', order_id);
                // Still respond success to client as payment is verified, but log error
                return res.json({ status: 'success', message: 'Payment verified, but error linking to invoice.', orderId: order_id, paymentId: payment_id });
            }

            const receiptParts = orderDetails.receipt.split('_');
            const invoiceId = receiptParts.length === 3 && receiptParts[0] === 'receipt' && receiptParts[1] === 'invoice' 
                              ? receiptParts[2] 
                              : null;

            if (invoiceId) {
                const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, {
                    paymentStatus: 'Paid',
                    paymentDate: new Date(),
                    razorpayPaymentId: payment_id,
                    razorpayOrderId: order_id,
                    razorpaySignature: signature,
                }, { new: true });

                if (updatedInvoice) {
                    console.log(`Invoice ${updatedInvoice.invoiceNumber} (ID: ${invoiceId}) marked as Paid.`);
                    res.json({ status: 'success', message: 'Payment verified and invoice updated.', orderId: order_id, paymentId: payment_id, invoiceId: invoiceId });
                } else {
                    console.error(`Failed to find and update invoice with ID: ${invoiceId} for order_id: ${order_id}`);
                    res.json({ status: 'success', message: 'Payment verified, but failed to update invoice record.', orderId: order_id, paymentId: payment_id });
                }
            } else {
                console.error('Could not parse invoiceId from receipt:', orderDetails.receipt, 'for order_id:', order_id);
                res.json({ status: 'success', message: 'Payment verified, but could not extract invoice ID from receipt.', orderId: order_id, paymentId: payment_id });
            }
        } else {
            res.status(400).json({ status: 'failure', message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Error verifying Razorpay payment:', error);
        res.status(500).json({ message: 'Failed to verify Razorpay payment', error: error.message });
    }
});

module.exports = router;
