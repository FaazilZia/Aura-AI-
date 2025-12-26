
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aura_ai';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatarUrl: String,
  joinedAt: Number
});

const MessageSchema = new mongoose.Schema({
  conversationId: String,
  senderId: String,
  senderName: String,
  text: String,
  timestamp: Number,
  type: String
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

// API Endpoints
app.post('/api/sync-user', async (req, res) => {
  try {
    const { id, name, avatarUrl } = req.body;
    
    // Simple UPSERT: Update if exists, otherwise create
    let user = await User.findOne({ id });
    
    if (user) {
      user.name = name || user.name;
      user.avatarUrl = avatarUrl || user.avatarUrl;
      await user.save();
      return res.json(user);
    } else {
      const newUser = new User({
        id,
        name,
        avatarUrl,
        joinedAt: Date.now()
      });
      await newUser.save();
      return res.json(newUser);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages/:convoId', async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.convoId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
