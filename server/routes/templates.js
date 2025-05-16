const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Template = require('../models/Template');
const User = require('../models/User'); // To check if user exists, if necessary

// @route   POST api/templates
// @desc    Create a new invoice template
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, extraFields } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ msg: 'Template name is required.' });
  }

  // Basic validation for extraFields
  if (extraFields && !Array.isArray(extraFields)) {
    return res.status(400).json({ msg: 'extraFields should be an array.' });
  }
  if (extraFields) {
    for (const field of extraFields) {
      if (!field.id || !field.label) {
        return res.status(400).json({ msg: 'Each extra field must have an id and a label.' });
      }
    }
  }

  try {
    const newTemplate = new Template({
      userId: req.user.id,
      name,
      extraFields: extraFields || [], // Default to empty array if not provided
    });

    const template = await newTemplate.save();
    res.status(201).json(template);
  } catch (err) {
    if (err.code === 11000) {
        return res.status(400).json({ msg: 'A template with this name already exists for your account.' });
    }
    console.error('Error creating template:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/templates
// @desc    Get all templates for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const templates = await Template.find({ userId: req.user.id }).sort({ name: 1 }); // Sort by name
    res.json(templates);
  } catch (err) {
    console.error('Error fetching templates:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/templates/:id
// @desc    Get a specific template by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ msg: 'Template not found.' });
    }

    // Ensure the template belongs to the logged-in user
    if (template.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to access this template.' });
    }

    res.json(template);
  } catch (err) {
    console.error('Error fetching template by ID:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Template not found (invalid ID format).' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/templates/:id
// @desc    Update an existing invoice template
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { name, extraFields } = req.body;

  // Basic validation
  if (name && name.trim() === '') {
    return res.status(400).json({ msg: 'Template name cannot be empty.' });
  }
  if (extraFields && !Array.isArray(extraFields)) {
    return res.status(400).json({ msg: 'extraFields should be an array.' });
  }
  if (extraFields) {
    for (const field of extraFields) {
      if (!field.id || !field.label) {
        return res.status(400).json({ msg: 'Each extra field must have an id and a label.' });
      }
    }
  }

  try {
    let template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ msg: 'Template not found.' });
    }

    // Ensure the template belongs to the logged-in user
    if (template.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to modify this template.' });
    }

    // Build template object
    const templateFields = {};
    if (name) templateFields.name = name;
    if (extraFields) templateFields.extraFields = extraFields;
    // To allow clearing extraFields, check if it's explicitly passed as an empty array
    if (req.body.hasOwnProperty('extraFields') && Array.isArray(extraFields) && extraFields.length === 0) {
        templateFields.extraFields = [];
    }

    template = await Template.findByIdAndUpdate(
      req.params.id,
      { $set: templateFields },
      { new: true, runValidators: true } // new: true returns the updated document, runValidators ensures schema rules are checked
    );

    res.json(template);
  } catch (err) {
    if (err.code === 11000) {
        return res.status(400).json({ msg: 'Another template with this name already exists for your account.' });
    }
    console.error('Error updating template:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/templates/:id
// @desc    Delete an invoice template
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ msg: 'Template not found.' });
    }

    // Ensure the template belongs to the logged-in user
    if (template.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to delete this template.' });
    }

    await template.deleteOne(); // Mongoose 6+ uses deleteOne()

    res.json({ msg: 'Template removed successfully.' });
  } catch (err) {
    console.error('Error deleting template:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Template not found (invalid ID format).' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
