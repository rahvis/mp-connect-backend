const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin-json.json');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'mp-connect-images.appspot.com'
});

const bucket = admin.storage().bucket();

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://ganateja:qwerty12345@mpcluster.q2u7p6t.mongodb.net/athlete_data?retryWrites=true&w=majority&appName=MPCluster';

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((error) => console.error('Error connecting to MongoDB Atlas:', error));

  // Connect to MongoDB Atlas
const conn = mongoose.createConnection(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Create a schema for athlete data
const athleteSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  sports: String,
  age: String,
  gender: String,
  playingTime: String,
  performanceAnxiety: String,
  injuries: String,
  ableToBalance: String,
  coachingAspect: String,
  profileImage: String,
  bookings: [
    {
      coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', required: true },
      coachName: { type: String, required: true },
      coachEmail: { type: String, required: true },
      googleMeetLink: { type: String, required: true },
      bookingTimestamp: { type: Date, required: true },
      bookingDate: { type: String, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
  ],
});

// Create a model based on the schema
const Athlete = mongoose.model('Athlete', athleteSchema);

// API endpoint to save athlete data
app.post('/api/athletes', async (req, res) => {
  try {
    const athleteData = req.body;
    if (req.file) {
      const blob = bucket.file(req.file.originalname);
      const blobWriter = blob.createWriteStream();
      blobWriter.on('error', (err) => {
        console.error('Error uploading image:', err);
        res.status(500).json({ error: 'An error occurred' });
      });
      blobWriter.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        athleteData.profileImage = publicUrl;
        const athlete = new Athlete(athleteData);
        await athlete.save();
        res.status(201).json(athlete);
      });
      blobWriter.end(req.file.buffer);
    } else {
      athleteData.profileImage = null;
      const athlete = new Athlete(athleteData);
      await athlete.save();
      res.status(201).json(athlete);
    }
  } catch (error) {
    console.error('Error saving athlete data:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
});

app.use('/uploads', express.static('uploads'));

app.post('/api/athletes/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const athlete = await Athlete.findOne({ email, password });
    if (!athlete) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json(athlete);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

const coachSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  profileImage: String,
  coaching: String,
  expertise: String,
  ageGroup: String,
  certifications: String,
  goodDealing: String,
  bookings: [
    {
      athleteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Athlete', required: true },
      googleMeetLink: { type: String, required: true },
      bookingTimestamp: { type: Date, required: true },
      bookingDate: { type: String, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
  ],
});

// Create a model based on the schema
const Coach = mongoose.model('Coach', coachSchema);

// API endpoint to save coach data
app.post('/api/coaches', async (req, res) => {
  try {
    const coachData = req.body;
    if (req.file) {
      const blob = bucket.file(req.file.originalname);
      const blobWriter = blob.createWriteStream();
      blobWriter.on('error', (err) => {
        console.error('Error uploading image:', err);
        res.status(500).json({ error: 'An error occurred' });
      });
      blobWriter.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        coachData.profileImage = publicUrl;
        const coach = new Coach(coachData);
        await coach.save();
        res.status(201).json(coach);
      });
      blobWriter.end(req.file.buffer);
    } else {
      coachData.profileImage = null;
      const coach = new Coach(coachData);
      await coach.save();
      res.status(201).json(coach);
    }
  } catch (error) {
    console.error('Error saving coach data:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
});


app.post('/api/coaches/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const coach = await Coach.findOne({ email, password });
    if (!coach) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json(coach);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Update athlete data
app.put('/api/athletes/:id', upload.single('profileImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = {};

    if (req.file) {
      const blob = bucket.file(req.file.originalname);
      const blobWriter = blob.createWriteStream();
      blobWriter.on('error', (err) => {
        console.error('Error uploading image:', err);
        res.status(500).json({ error: 'An error occurred' });
      });
      blobWriter.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        updatedData.profileImage = publicUrl;
        const athlete = await Athlete.findByIdAndUpdate(
          id,
          { $set: updatedData },
          { new: true }
        );
        if (!athlete) {
          return res.status(404).json({ error: 'Athlete not found' });
        }
        res.json(athlete);
      });
      blobWriter.end(req.file.buffer);
    } else {
      const athlete = await Athlete.findByIdAndUpdate(
        id,
        { $set: updatedData },
        { new: true }
      );
      if (!athlete) {
        return res.status(404).json({ error: 'Athlete not found' });
      }
      res.json(athlete);
    }
  } catch (error) {
    console.error('Error updating athlete data:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Update coach data
app.put('/api/coaches/:id', upload.single('profileImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = {};

    if (req.file) {
      const blob = bucket.file(req.file.originalname);
      const blobWriter = blob.createWriteStream();
      blobWriter.on('error', (err) => {
        console.error('Error uploading image:', err);
        res.status(500).json({ error: 'An error occurred' });
      });
      blobWriter.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        updatedData.profileImage = publicUrl;
        const coach = await Coach.findByIdAndUpdate(
          id,
          { $set: updatedData },
          { new: true }
        );
        if (!coach) {
          return res.status(404).json({ error: 'Coach not found' });
        }
        res.json(coach);
      });
      blobWriter.end(req.file.buffer);
    } else {
      const coach = await Coach.findByIdAndUpdate(
        id,
        { $set: updatedData },
        { new: true }
      );
      if (!coach) {
        return res.status(404).json({ error: 'Coach not found' });
      }
      res.json(coach);
    }
  } catch (error) {
    console.error('Error updating coach data:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/api/coaches', async (req, res) => {
  try {
    const coaches = await Coach.find();
    res.json(coaches);
  } catch (error) {
    console.error('Error fetching coaches:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/api/athletes/:id/bookings', async (req, res) => {
  try {
    const { id } = req.params;
    const athlete = await Athlete.findById(id).populate('bookings.coachId');
    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }
    res.json(athlete.bookings);
  } catch (error) {
    console.error('Error fetching athlete bookings:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/api/coaches/:id/sessions', async (req, res) => {
  try {
    const coachId = req.params.id;
    const coach = await Coach.findById(coachId).populate('bookings.athleteId');
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }
    const upcomingSessions = coach.bookings.map((booking) => ({
      _id: booking._id,
      athleteName: booking.athleteId.fullName,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      googleMeetLink: booking.googleMeetLink,
    }));
    res.json(upcomingSessions);
  } catch (error) {
    console.error('Error fetching coach sessions:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.put('/api/coaches/:id/availability', async (req, res) => {
  try {
    const coachId = req.params.id;
    const { availableTimings } = req.body;
    const coach = await Coach.findByIdAndUpdate(
      coachId,
      { availableTimings },
      { new: true }
    );
    if (!coach) {
      return res.status(404).json({ error: 'Coach not found' });
    }
    res.json(coach);
  } catch (error) {
    console.error('Error saving coach availability:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('callStarted', (data) => {
    console.log('Call started:', data);
    io.emit('callStarted', data);
  });

  socket.on('callEnded', (data) => {
    console.log('Call ended:', data);
    io.emit('callEnded', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Update the session status when a call starts
app.put('/api/sessions/:id/start-call', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findByIdAndUpdate(id, { callStarted: true }, { new: true });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true, session });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Update the session status when a call ends
app.put('/api/sessions/:id/end-call', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await Session.findByIdAndUpdate(id, { callStarted: false }, { new: true });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true, session });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Start the server
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
