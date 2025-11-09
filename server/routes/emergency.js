const express = require('express');
const { body, validationResult } = require('express-validator');
const twilio = require('twilio');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// @route   POST /api/emergency/alert
// @desc    Send emergency alert
// @access  Public
router.post('/alert', [
  body('phone').isLength({ min: 10, max: 15 }).withMessage('Valid phone number required'),
  body('message').optional().trim().isLength({ max: 160 }).withMessage('Message too long'),
  body('location').optional().isObject().withMessage('Invalid location format'),
  body('emergencyType').optional().isIn(['medical', 'police', 'fire', 'general']).withMessage('Invalid emergency type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, message, location, emergencyType = 'medical' } = req.body;

    // Format phone number for Kenya
    const formattedPhone = phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`;

    // Create emergency message
    let emergencyMessage = `🚨 EMERGENCY ALERT 🚨\n\n`;
    
    if (message) {
      emergencyMessage += `Message: ${message}\n\n`;
    }

    if (location && location.latitude && location.longitude) {
      emergencyMessage += `📍 Location: https://maps.google.com/?q=${location.latitude},${location.longitude}\n\n`;
    }

    emergencyMessage += `Emergency Type: ${emergencyType.toUpperCase()}\n`;
    emergencyMessage += `Time: ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}\n\n`;

    // Add emergency contacts based on type
    const emergencyContacts = getEmergencyContacts(emergencyType);
    emergencyMessage += `Emergency Contacts:\n${emergencyContacts}`;

    // Send SMS
    try {
      await twilioClient.messages.create({
        body: emergencyMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      res.json({ 
        message: 'Emergency alert sent successfully',
        phone: formattedPhone,
        timestamp: new Date().toISOString()
      });
    } catch (twilioError) {
      console.error('Twilio error:', twilioError);
      res.status(500).json({ message: 'Failed to send emergency alert' });
    }
  } catch (error) {
    console.error('Emergency alert error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/emergency/ambulance
// @desc    Request ambulance
// @access  Public
router.post('/ambulance', [
  body('phone').isLength({ min: 10, max: 15 }).withMessage('Valid phone number required'),
  body('location').isObject().withMessage('Location is required'),
  body('patientName').optional().trim().isLength({ max: 100 }),
  body('condition').optional().trim().isLength({ max: 200 }),
  body('urgency').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid urgency level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, location, patientName, condition, urgency = 'medium' } = req.body;

    // Format phone number
    const formattedPhone = phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`;

    // Create ambulance request message
    let ambulanceMessage = `🚑 AMBULANCE REQUEST 🚑\n\n`;
    
    if (patientName) {
      ambulanceMessage += `Patient: ${patientName}\n`;
    }
    
    if (condition) {
      ambulanceMessage += `Condition: ${condition}\n`;
    }
    
    ambulanceMessage += `Urgency: ${urgency.toUpperCase()}\n`;
    ambulanceMessage += `Time: ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}\n\n`;
    
    if (location.latitude && location.longitude) {
      ambulanceMessage += `📍 Location: https://maps.google.com/?q=${location.latitude},${location.longitude}\n\n`;
    }

    // Add ambulance contacts
    ambulanceMessage += `Ambulance Services:\n`;
    ambulanceMessage += `• Emergency: ${process.env.AMBULANCE_PHONE || '+254700000001'}\n`;
    ambulanceMessage += `• Red Cross: +254700000002\n`;
    ambulanceMessage += `• St. John Ambulance: +254700000003\n\n`;
    ambulanceMessage += `Please call the nearest service immediately!`;

    // Send SMS
    try {
      await twilioClient.messages.create({
        body: ambulanceMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      res.json({ 
        message: 'Ambulance request sent successfully',
        phone: formattedPhone,
        timestamp: new Date().toISOString()
      });
    } catch (twilioError) {
      console.error('Twilio error:', twilioError);
      res.status(500).json({ message: 'Failed to send ambulance request' });
    }
  } catch (error) {
    console.error('Ambulance request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/emergency/contacts
// @desc    Get emergency contacts
// @access  Public
router.get('/contacts', async (req, res) => {
  try {
    const contacts = {
      police: {
        name: 'Police Emergency',
        phone: '+254700000000',
        description: 'For criminal activities, accidents, and security emergencies'
      },
      ambulance: {
        name: 'Ambulance Services',
        phone: '+254700000001',
        description: 'For medical emergencies requiring immediate transport'
      },
      fire: {
        name: 'Fire Department',
        phone: '+254700000002',
        description: 'For fire emergencies and rescue services'
      },
      redCross: {
        name: 'Red Cross',
        phone: '+254700000003',
        description: 'Emergency medical services and disaster response'
      },
      stJohn: {
        name: 'St. John Ambulance',
        phone: '+254700000004',
        description: 'First aid and emergency medical services'
      },
      mentalHealth: {
        name: 'Mental Health Crisis',
        phone: '+254700000005',
        description: '24/7 mental health crisis support'
      }
    };

    res.json(contacts);
  } catch (error) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/emergency/guidelines
// @desc    Get emergency response guidelines
// @access  Public
router.get('/guidelines', async (req, res) => {
  try {
    const guidelines = {
      medical: {
        title: 'Medical Emergency Guidelines',
        steps: [
          'Stay calm and assess the situation',
          'Call emergency services immediately',
          'Provide first aid if trained',
          'Keep the patient comfortable',
          'Do not move the patient unless necessary',
          'Gather medical information if possible'
        ]
      },
      accident: {
        title: 'Accident Response Guidelines',
        steps: [
          'Ensure your own safety first',
          'Call emergency services',
          'Do not move injured persons',
          'Control traffic if possible',
          'Provide first aid if trained',
          'Stay with the injured until help arrives'
        ]
      },
      fire: {
        title: 'Fire Emergency Guidelines',
        steps: [
          'Evacuate immediately',
          'Call fire department',
          'Do not use elevators',
          'Stay low if there is smoke',
          'Feel doors before opening',
          'Meet at designated assembly point'
        ]
      }
    };

    res.json(guidelines);
  } catch (error) {
    console.error('Get guidelines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get emergency contacts based on type
function getEmergencyContacts(type) {
  const contacts = {
    medical: `• Ambulance: ${process.env.AMBULANCE_PHONE || '+254700000001'}\n• Red Cross: +254700000002\n• St. John: +254700000003`,
    police: `• Police: +254700000000\n• CID: +254700000006\n• Traffic Police: +254700000007`,
    fire: `• Fire Department: +254700000002\n• Emergency Services: +254700000008`,
    general: `• Emergency: +254700000000\n• Ambulance: +254700000001\n• Fire: +254700000002`
  };

  return contacts[type] || contacts.general;
}

module.exports = router;





