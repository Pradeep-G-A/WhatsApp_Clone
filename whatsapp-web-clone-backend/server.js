const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Replace with your URI (ensure URL encoding of special characters)
const MONGO_URI = 'mongodb+srv://gapradeep:161814eep@cluster0.agdzwjs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const messageSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  from: String,
  to: String,
  wa_id: String,
  text: String,
  timestamp: Number,
  status: String,
  type: String
});

const Message = mongoose.model('processed_messages', messageSchema);

// Process payload function to read and insert/update messages from JSON webhook payload
async function processPayload(payload) {
  if (!payload?.metaData?.entry) return;

  for (const entry of payload.metaData.entry) {
    for (const change of entry.changes) {
      const val = change.value;
      if (val.messages) {
        for (const msg of val.messages) {
          const data = {
            id: msg.id,
            from: msg.from,
            wa_id: val.contacts?.[0]?.wa_id || msg.from,
            text: msg.text?.body || '',
            timestamp: parseInt(msg.timestamp),
            status: 'sent',
            type: msg.type
          };
          await Message.updateOne({ id: data.id }, { $setOnInsert: data }, { upsert: true });
        }
      }
      if (val.statuses) {
        for (const statusObj of val.statuses) {
          await Message.updateOne({ id: statusObj.id }, { $set: { status: statusObj.status, status_time: statusObj.timestamp } });
        }
      }
    }
  }
}

// Endpoint to process all JSON payload files in backend payloads directory
app.get('/process-payloads', async (req, res) => {
  const payloadFolder = path.join(__dirname, 'payloads');
  try {
    const files = fs.readdirSync(payloadFolder);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const payload = JSON.parse(fs.readFileSync(path.join(payloadFolder, file)));
        await processPayload(payload);
      }
    }
    res.send({ success: true, message: 'Processed all payloads' });
  } catch (err) {
    res.status(500).send({ success: false, error: err.message });
  }
});

// Get list of conversations grouped by wa_id (with last message)
app.get('/conversations', async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$wa_id', lastMessage: { $first: '$text' }, lastTimestamp: { $first: '$timestamp' }, from: { $first: '$from' } } },
      { $sort: { lastTimestamp: -1 } }
    ]);
    res.json(conversations);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Get messages for a wa_id
app.get('/messages/:wa_id', async (req, res) => {
  try {
    const messages = await Message.find({ wa_id: req.params.wa_id }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Send a new message (store only)
app.post('/messages/:wa_id', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send({ error: 'Message text required' });

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const newMsg = new Message({
      id: `local-${timestamp}-${req.params.wa_id}`,
      from: '916369114503', // Use your business number here
      wa_id: req.params.wa_id,
      text,
      timestamp,
      status: 'sent',
      type: 'text'
    });
    await newMsg.save();
    res.json(newMsg);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
