const nodemailer = require('nodemailer');

// Email Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Ya koi bhi email service jo use karna ho
  auth: {
    user: 'f223296@cfd.nu.edu.pk',  // Apna email daalna
    pass: 'bywerfoabrwqzscp'    // Apna email password daalna
  }
});

// Send Email Function
const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: 'f223296@cfd.nu.edu.pk',
    to: to,
    subject: subject,
    text: text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error: ', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

module.exports = { sendEmail };
