const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.post('/send-email', (req, res) => {
  const { to, subject, text } = req.body;
  emailController.sendEmail(to, subject, text);
  res.send('Email Sent!');
});

module.exports = router;
