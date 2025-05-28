const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const PDFDocument = require('pdfkit');
const auth = require('../middleware/authMiddleware'); // Import auth middleware
const nodemailer = require('nodemailer'); // Add nodemailer

// --- Reusable PDF Generation Function ---
async function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', (err) => {
        reject(err);
    });

    // PDF Content Generation (Copied from existing GET /:id/pdf route)
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(invoice.companyName || 'Your Company Name', { align: 'right' });
    doc.text(invoice.companyAddress || '123 Your Street', { align: 'right' });
    doc.text(invoice.companyEmail || 'your@email.com', { align: 'right' });
    doc.text(invoice.companyPhone || '', { align: 'right' });
    doc.moveDown();

    doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`);
    if (invoice.dueDate) {
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    }
    doc.moveDown();
    doc.text('Bill To:');
    doc.fontSize(10).text(invoice.clientName);
    if (invoice.clientAddress) doc.text(invoice.clientAddress);
    if (invoice.clientEmail) doc.text(invoice.clientEmail);
    doc.moveDown(2);

    const tableTop = doc.y;
    doc.fontSize(10);
    doc.text('Description', 50, tableTop);
    doc.text('Qty', 300, tableTop, { width: 50, align: 'right' });
    doc.text('Unit Price', 370, tableTop, { width: 70, align: 'right' });
    doc.text('Total', 0, tableTop, { align: 'right' });
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
    doc.moveDown(0.5);

    let itemY = tableTop + 20;
    invoice.lineItems.forEach(item => {
      doc.fontSize(10);
      doc.text(item.description, 50, itemY);
      doc.text(item.quantity.toString(), 300, itemY, { width: 50, align: 'right' });
      doc.text(`₹${parseFloat(item.unitPrice).toFixed(2)}`, 370, itemY, { width: 70, align: 'right' });
      doc.text(`₹${(parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2)}`, 0, itemY, { align: 'right' });
      itemY += 20;
    });

    doc.moveTo(50, itemY).lineTo(550, itemY).stroke();
    doc.moveDown();

    doc.fontSize(12).text(`Subtotal: ₹${parseFloat(invoice.subTotal).toFixed(2)}`, { align: 'right' });
    doc.text(`Tax (${invoice.taxRate}%): ₹${parseFloat(invoice.taxAmount).toFixed(2)}`, { align: 'right' });
    doc.fontSize(14).text(`Total Amount: ₹${parseFloat(invoice.totalAmount).toFixed(2)}`, { align: 'right' });
    doc.moveDown(2);

    if (invoice.notes) {
        doc.fontSize(10).text('Notes:');
        doc.text(invoice.notes);
    }

    doc.end();
  });
}

// --- Reusable Email Sending Function ---
async function sendInvoiceEmail(emailTransporter, invoice, pdfBuffer, fromEmailAddress) {
  const { clientEmail, clientName, invoiceNumber, companyName, _id: invoiceId } = invoice; // Added _id as invoiceId

  const clientAppUrl = process.env.CLIENT_APP_URL || 'http://65.0.19.202:5173'; // Get client app URL
  const paymentUrl = `${clientAppUrl}/pay-invoice/${invoiceId}`; // Construct payment URL

  const mailOptions = {
    from: `"${companyName || 'Your Company'}" <${fromEmailAddress}>`,
    to: clientEmail,
    subject: `Invoice ${invoiceNumber} from ${companyName || 'Your Company'}`,
    text: `Dear ${clientName},\n\nPlease find attached your invoice ${invoiceNumber}.\n\nYou can also pay online by clicking here: ${paymentUrl}\n\nThank you,\n${companyName || 'Our Team'}`,
    html: `<p>Dear ${clientName},</p>
           <p>Please find attached your invoice ${invoiceNumber}.</p>
           <p>
             <a href="${paymentUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
               Pay Now
             </a>
           </p>
           <p>If the button above doesn't work, copy and paste this link into your browser: ${paymentUrl}</p>
           <p>Thank you,<br>${companyName || 'Our Team'}</p>`,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    console.log(`Invoice email sent successfully via Nodemailer to ${clientEmail} for invoice ${invoiceNumber}`);
  } catch (emailError) {
    console.error(`Error sending invoice email via Nodemailer for ${invoiceNumber} to ${clientEmail}:`, emailError);
    // Rethrow the error if you want the caller to handle it, or handle it here
    // For now, just logging, as in the previous version
  }
}
// --- End Reusable Email Sending Function ---

// @route   GET api/invoices
router.get('/', auth, async (req, res) => {
  try {
    const { clientName } = req.query; // Get clientName from query parameters
    const query = { userId: req.user.id };

    if (clientName) {
      query.clientName = { $regex: clientName, $options: 'i' }; // Case-insensitive regex search
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/invoices/stats
// @desc    Get invoice statistics for the logged-in user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user.id });

    let paidInvoicesCount = 0;
    let dueInvoicesCount = 0; // For now, all pending invoices are considered "due"
    let totalRevenue = 0;

    invoices.forEach(invoice => {
      if (invoice.paymentStatus === 'Paid') {
        paidInvoicesCount++;
        totalRevenue += invoice.totalAmount;
      } else if (invoice.paymentStatus === 'Pending') {
        dueInvoicesCount++;
        // Optionally, add logic here to check if dueDate is past
      }
    });

    res.json({
      paidInvoicesCount,
      dueInvoicesCount,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)), // Ensure two decimal places
    });

  } catch (err) {
    console.error('Error fetching invoice stats:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/invoices
// @desc    Create a new invoice for the logged-in user
// @access  Private
router.post('/', auth, async (req, res) => {
  const { clientName, clientAddress, clientEmail, issueDate, dueDate, lineItems, notes, companyName, companyAddress, companyEmail, companyPhone, templateId, templateData } = req.body;
  let { taxRate } = req.body; // Make taxRate mutable for parsing

  if (!clientName || !lineItems || lineItems.length === 0) {
    return res.status(400).json({ msg: 'Please include client name and at least one line item' });
  }
  if (!clientEmail) {
    return res.status(400).json({ msg: 'Client email is required to send the invoice' });
  }

  // Validate and parse taxRate
  const parsedTaxRate = parseFloat(taxRate);
  if (isNaN(parsedTaxRate) || parsedTaxRate < 0) {
    taxRate = 0; // Default to 0 if invalid or not provided
  } else {
    taxRate = parsedTaxRate;
  }

  try {
    // Ensure lineItems quantities and unitPrices are numbers
    const validatedLineItems = lineItems.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
    }));

    const calculatedSubTotal = validatedLineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const calculatedTaxAmount = calculatedSubTotal * (taxRate / 100);
    const totalAmount = calculatedSubTotal + calculatedTaxAmount;
    const userInvoiceCount = await Invoice.countDocuments({ userId: req.user.id });
    const invoiceNumber = `INV-${String(userInvoiceCount + 1).padStart(4, '0')}-${new Date().getFullYear().toString().slice(-2)}`;

    const newInvoice = new Invoice({
      userId: req.user.id,
      invoiceNumber,
      clientName,
      clientAddress,
      clientEmail,
      issueDate,
      dueDate,
      lineItems,
      notes,
      companyName,
      companyAddress,
      companyEmail,
      companyPhone,
      templateId,
      templateData,
      subTotal: calculatedSubTotal,
      taxRate,
      taxAmount: calculatedTaxAmount,
      totalAmount,
    });

    const invoice = await newInvoice.save();
    console.log(invoice, 'invoiceinvoice');

    // --- Email Sending Logic with Nodemailer ---
    const emailTransporter = req.app.get('emailTransporter');
    const fromEmailAddress = process.env.EMAIL_FROM_ADDRESS;

    if (emailTransporter && clientEmail && fromEmailAddress) {
      try {
        const pdfBuffer = await generateInvoicePDF(invoice);
        // Call the reusable email function
        await sendInvoiceEmail(emailTransporter, invoice, pdfBuffer, fromEmailAddress);
      } catch (error) {
        // If generateInvoicePDF fails or sendInvoiceEmail rethrows an error that needs handling for the main request flow
        console.error(`Failed to generate PDF or send email for invoice ${invoice.invoiceNumber}:`, error);
        // Decide if this should interrupt the response. For now, it doesn't, matching previous logic.
      }
    } else {
      if (!clientEmail) {
        console.warn(`Cannot send invoice email for ${invoice.invoiceNumber}: Client email not provided.`);
      }
      if (!fromEmailAddress) {
        console.warn(`Cannot send invoice email for ${invoice.invoiceNumber}: EMAIL_FROM_ADDRESS not configured in .env`);
      }
      if (!emailTransporter) {
        console.warn(`Cannot send invoice email for ${invoice.invoiceNumber}: Email transporter not configured.`);
      }
    }
    // --- End Email Sending Logic ---

    res.status(201).json(invoice);
  } catch (err) {
    console.error('Error creating invoice:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/invoices/:id
// @desc    Get a single invoice by ID (accessible for payment)
// @access  Public (for payment link)
router.get('/:id', async (req, res) => { // REMOVED 'auth' MIDDLEWARE HERE
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    // No authorization check here to allow payment link access
    res.json(invoice);
  } catch (err) {
    console.error('Error fetching invoice by ID:', err.message); // ENSURE CONSOLE LOG IS GENERIC
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Invoice not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/invoices/:id/pdf
// @desc    Download invoice as PDF (for the logged-in user)
// @access  Private
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ msg: 'Invoice not found' });
    }

    if (invoice.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to download this PDF' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('Error generating or sending PDF:' ,err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Invoice not found' });
    }
    res.status(500).send('Server Error generating PDF');
  }
});

// Add routes for GET single invoice, PUT (update), DELETE

module.exports = router;
