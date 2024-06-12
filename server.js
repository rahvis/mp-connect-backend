const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const { upload, gfs } = require('./upload');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://ganateja:qwerty12345@mpcluster.q2u7p6t.mongodb.net/athlete_data?retryWrites=true&w=majority&appName=MPCluster';

// Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((error) => console.error('Error connecting to MongoDB Atlas:', error));

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
  profileImage: { type: mongoose.Schema.Types.ObjectId, ref: 'fs.files' },
});

// Create a model based on the schema
const Athlete = mongoose.model('Athlete', athleteSchema);

// API endpoint to save athlete data
app.post('/api/athletes', upload.single('profileImage'), async (req, res) => {
  try {
    const athleteData = req.body;
    if (req.file) {
      athleteData.profileImage = req.file.id;
    } else {
      athleteData.profileImage = null;
    }
    const athlete = new Athlete(athleteData);
    await athlete.save();
    res.status(201).json(athlete);
  } catch (error) {
    console.error('Error saving athlete data:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'An error occurred' });
    }
  }
});

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

// Start the server
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get('/api/athletes/:id/image', async (req, res) => {
  try {
    const file = await gfs.files.findOne({ _id: mongoose.Types.ObjectId(req.params.id) });
    if (!file) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const readStream = gfs.createReadStream(file.filename);
    readStream.pipe(res);
  } catch (error) {
    console.error('Error retrieving image:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

const coachSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  profileImage: { type: mongoose.Schema.Types.ObjectId, ref: 'fs.files' },
  coaching: String,
  expertise: String,
  ageGroup: String,
  certifications: String,
  goodDealing: String,
});

// Create a model based on the schema
const Coach = mongoose.model('Coach', coachSchema);

// API endpoint to save coach data
app.post('/api/coaches', upload.single('profileImage'), async (req, res) => {
  try {
    const coachData = req.body;
    if (req.file) {
      coachData.profileImage = req.file.id;
    } else {
      coachData.profileImage = null;
    }
    const coach = new Coach(coachData);
    await coach.save();
    res.status(201).json(coach);
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

app.get('/api/coaches/:id/image', async (req, res) => {
  try {
    const file = await gfs.files.findOne({ _id: mongoose.Types.ObjectId(req.params.id) });
    if (!file) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const readStream = gfs.createReadStream(file.filename);
    readStream.pipe(res);
  } catch (error) {
    console.error('Error retrieving image:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});