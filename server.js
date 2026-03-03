const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');     
const compression = require('compression'); 

dotenv.config();

const app = express();

app.use(compression()); //Enable Gzip compression to significantly reduce transmission size
app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public', { index: 'home.html' }));

//Minimalist XSS Sanitizer
function sanitize(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// connect database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Fantastic! Successfully connected to the MongoDB database!'))
  .catch((err) => console.error('Oops, the database connection failed:', err.message));

// test
app.get('/', (req, res) => {
  res.send('The Campus Lost & Found backend server is running!');
});

const Item = require('./models/Item');

// new post 
app.post('/api/items', async (req, res) => {
  try {
    const { title, description, category, location, date, contactInfo, submittedBy, status, imageUrl } = req.body;

    //Backend input validation
    if (!title || !description || !category || !location) {
        return res.status(400).json({ 
            success: false, 
            message: 'Validation Error: Title, description, category, and location are required.' 
        });
    }

    //XSS Data Cleaning
    const newItem = new Item({
        title: sanitize(title),
        description: sanitize(description),
        category: sanitize(category),
        location: sanitize(location),
        date: sanitize(date),
        contactInfo: sanitize(contactInfo),
        submittedBy: sanitize(submittedBy),
        status: sanitize(status) || 'Active',
        imageUrl: imageUrl 
    });

    const savedItem = await newItem.save();
    res.status(201).json({ success: true, message: 'Successfully posted a lost and found item!', data: savedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Publishing failed', error: error.message });
  }
});

// get all post
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 }); 
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to get data', error: error.message });
  }
}); 

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    // If data for this ID is not found, a 404 error will be returned.
    if (!item) {
      return res.status(404).json({ success: false, message: 'Sorry, this item information cannot be found.' });
    }
    
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Data retrieval failed. Please check the ID format.', error: error.message });
  }
});

// edit post
app.put('/api/items/:id', async (req, res) => {
  try {
    const cleanData = {};
    for (const key in req.body) {
        if (key !== 'imageUrl') { 
            cleanData[key] = sanitize(req.body[key]);
        } else {
            cleanData[key] = req.body[key];
        }
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, cleanData, { new: true });
    if (!updatedItem) return res.status(404).json({ success: false, message: 'The item cannot be found' });
    
    res.json({ success: true, data: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// delete post
app.delete('/api/items/:id', async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ success: false, message: 'The item cannot be found' });
    
    res.json({ success: true, message: 'Delete successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//auth
const User = require('./models/User');

//register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email.endsWith('@qiu.edu.my')) {
      return res.status(400).json({ success: false, message: 'Only @qiu.edu.my emails are allowed' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ 
      name: sanitize(name), 
      email, 
      password: hashedPassword 
    });
    
    await newUser.save();
    res.json({ success: true, message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// forgor password
app.post('/api/auth/forgot-password', async (req, res) => { 
  try {
    const { email, newPassword } = req.body;

    if (!email.endsWith('@qiu.edu.my')) {
      return res.status(400).json({ success: false, message: 'Invalid university email.' });
    }
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email not found.' });
    }

    //Encrypt the new password and save it.
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//3. Update user information
app.put('/api/auth/user/:id', async (req, res) => {
  try {
    const { name, password } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = sanitize(name); 
    
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long' });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({ 
      success: true, 
      message: 'Profile updated successfully!',
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

//Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`The server is now running! Please visit it in your browser: http://localhost:${PORT}`);
});