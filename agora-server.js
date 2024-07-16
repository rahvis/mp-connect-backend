require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4321;
const APP_ID = process.env.PUBLIC_AGORA_APP_ID;

app.post('/join-channel', (req, res) => {
  const { channelName } = req.body;
  if (!channelName) {
    return res.status(400).json({ error: 'Channel name is required' });
  }

  console.log('Join channel request received for:', channelName);
  if (!APP_ID) {
    console.error('ERROR: Agora App ID is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  return res.json({ appId: APP_ID, channel: channelName });
});

app.listen(PORT, () => {
  console.log(`Agora server is running on port ${PORT}`);
  console.log('APP_ID:', APP_ID);
  console.log('APP_ID:', APP_ID ? 'Set correctly' : 'NOT SET');
});