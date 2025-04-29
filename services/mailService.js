const nodemailer = require("nodemailer");

// Nodemailer transporter create karo
const transporter = nodemailer.createTransport({
  service: "gmail", // Agar Gmail use kar rahe ho
  auth: {
    user: "f223296@cfd.nu.edu.pk", // Apna Gmail ID daalo
    pass: "bywerfoabrwqzscp", // Apni email ka password ya app password daalo
  },
});

// Function to send email
const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: "f223296@cfd.nu.edu.pk", // Same email ID jo above diya tha
    to, // Receiver email
    subject,
    text, // Email body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error occurred: ", error);
    } else {
      console.log("Email sent: ", info.response);
    }
  });
};

module.exports = sendEmail;
