const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.timeout = 120000; // Set the timeout to 2 minutes

app.use('/temp', express.static(path.join(__dirname, 'temp')));

app.get('/audio-url', async (req, res) => {
    const videoUrl = req.query.videoUrl;
    try {
      const info = await ytdl.getInfo(videoUrl);
      const audioURL = ytdl.chooseFormat(info.formats, { filter: 'audioonly' }).url;
  
      // Define the output file path
      const outputFilePath = path.join(__dirname, 'temp', `${Date.now()}.mp3`);
  
      // Create a writable stream to save the converted audio
      const writeStream = fs.createWriteStream(outputFilePath);
  
      // Use FFmpeg to convert the audio format
      ffmpeg()
        .input(audioURL)
        .format('mp3')
        .audioCodec('libmp3lame')
        .pipe(writeStream);
  
      // When the conversion is done, send the URL of the converted file
      writeStream.on('finish', () => {
        res.json({ audioURL: `${req.protocol}://${req.get('host')}/temp/${path.basename(outputFilePath)}` });
      });
  
      // Handle errors during the conversion
      writeStream.on('error', (error) => {
        console.error('Error during audio conversion:', error);
        res.status(500).json({ error: 'Error during audio conversion' });
      });
  
    } catch (error) {
      console.error('Error fetching audio URL:', error);
      res.status(500).json({ error: 'Error fetching audio URL' });
    }
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
