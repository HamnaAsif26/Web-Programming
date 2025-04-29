const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');

app.use(bodyParser.json());  // To parse JSON requests

// Use Routes
app.use('/api', userRoutes);

mongoose.connect('mongodb://localhost/arte-db', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => console.log(err));

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
