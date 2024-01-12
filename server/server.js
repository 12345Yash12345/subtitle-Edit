const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

function generateSRT(subtitles) {
  let srtContent = '';
  subtitles.forEach((subtitle, index) => {
    srtContent += `${index + 1}\n`;
    srtContent += `${formatTimestamp(subtitle.timestamp)} --> ${formatTimestamp(subtitle.timestamp + 1)}\n`;
    srtContent += `${subtitle.text}\n\n`;
  });
  return srtContent.trim();
}

function formatTimestamp(timestamp) {
  const hours = Math.floor(timestamp / 3600);
  const minutes = Math.floor((timestamp % 3600) / 60);
  const seconds = (timestamp % 60).toFixed(3);

  return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}

function padZero(number) {
  return number.toString().padStart(2, '0');
}

app.post('/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      console.log('Invalid video file. No file or buffer found.');
      return res.status(400).json({ error: 'Invalid video file.' });
    }

    const videoBuffer = req.file.buffer;
    const subtitlesString = req.body.subtitles;

    // Parse the subtitles JSON
    const subtitles = JSON.parse(subtitlesString);

    console.log('Received Subtitles:', subtitles);

    // Save the video file to disk (inside the 'uploads' folder)
    fs.writeFileSync(`uploads/${req.file.originalname}`, videoBuffer);

    // Save subtitles as an SRT file
    const srtContent = generateSRT(subtitles);
    console.log('Generated SRT Content:', srtContent);

    fs.writeFileSync(`uploads/${req.file.originalname.replace(/\.[^/.]+$/, "")}.srt`, srtContent);

    res.json({ message: 'Video and subtitles received successfully.' });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});


app.get('/subtitles/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const srtFilePath = `uploads/${filename}.srt`;

    // Read the subtitles file
    const srtContent = fs.readFileSync(srtFilePath, 'utf-8');

    // Parse the subtitles content if needed
    // For simplicity, we are sending the raw content for demonstration purposes
    res.json({ subtitles: srtContent });
  } catch (error) {
    console.error('Error retrieving subtitles:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
