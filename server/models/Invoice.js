const mongoose = require('mongoose');

const LineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
});

const InvoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Reference to the User model
  },
  invoiceNumber: { type: String, required: true }, 
  clientName: { type: String, required: true },
  clientAddress: { type: String },
  clientEmail: { type: String },
  // Company details (denormalized from User at time of creation for historical accuracy)
  companyName: { type: String, required: true },
  companyAddress: { type: String },
  companyEmail: { type: String },
  companyPhone: { type: String },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  lineItems: [LineItemSchema],
  notes: { type: String },
  totalAmount: { type: Number, required: true, min: 0 },
  subTotal: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, required: true, min: 0 },

  // Payment Tracking Fields
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },
  paymentDate: { type: Date },
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String }, 
  razorpaySignature: { type: String },

  // Add other relevant fields: status (draft, sent, paid), company info, etc.
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

// Compound index to ensure invoiceNumber is unique per userId
InvoiceSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
