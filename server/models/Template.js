const mongoose = require('mongoose');

const ExtraFieldSchema = new mongoose.Schema({
  id: { // This will be used as the key in formData.extraData and for HTML element IDs
    type: String,
    required: true,
    trim: true,
  },
  label: { // The display label for the form field
    type: String,
    required: true,
    trim: true,
  },
  type: { // HTML input type, e.g., 'text', 'number', 'date', 'textarea'
    type: String,
    default: 'text',
    trim: true,
  },
  // You could add more options here, like 'required: Boolean', 'defaultValue: String', etc.
}, { _id: false }); // No separate _id for subdocuments unless needed

const TemplateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Reference to the User model (the company/organization)
  },
  name: {
    type: String,
    required: [true, 'Please add a template name'],
    trim: true,
  },
  extraFields: [ExtraFieldSchema], // Array of custom fields defined for this template
  // We can add more template-specific fields here if needed, e.g., defaultNotes, defaultPaymentTerms
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

// Ensure that for a given user, template names are unique
// This prevents a user from having multiple templates with the exact same name.
TemplateSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Template', TemplateSchema);
