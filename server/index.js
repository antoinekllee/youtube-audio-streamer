const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.timeout = 120000; // Set the timeout to 2 minutes

app.use("/temp", express.static(path.join(__dirname, "temp")));

app.get("/audio-url", async (req, res) => {
    const videoUrl = req.query.videoUrl;
    try {
        const info = await ytdl.getInfo(videoUrl);
        const audioURL = ytdl.chooseFormat(info.formats, {
            filter: "audioonly",
        }).url;

        const outputFilePath = path.join(
            __dirname,
            "temp",
            `${Date.now()}.mp3`
        ); // Define the output file path

        const writeStream = fs.createWriteStream(outputFilePath); // Create a writable stream to save the converted audio

        // Use FFmpeg to convert the audio format
        ffmpeg()
            .input(audioURL)
            .inputOptions(["-rw_timeout 10000000", "-timeout 6000000"]) // Timeout set to 10 seconds for network operations
            .format("mp3")
            .audioCodec("libmp3lame")
            .on("end", function () {
                console.log("Conversion finished!");
                if (!res.headersSent) {
                    res.json({
                        audioURL: `${req.protocol}://${req.get(
                            "host"
                        )}/temp/${path.basename(outputFilePath)}`,
                    });
                }
            })
            .on("error", function (err, stdout, stderr) {
                console.error("Error:", err);
                console.error("ffmpeg stdout:", stdout);
                console.error("ffmpeg stderr:", stderr);
                if (!res.headersSent) {
                    res.status(500).json({
                        error: "Error during audio conversion",
                    });
                }
            })
            .on("start", function (commandLine) {
                console.log("Spawned Ffmpeg with command: " + commandLine);
            })
            .pipe(writeStream, { end: true }); // Pipe the output of ffmpeg to the file
    } catch (error) {
        console.error("Error fetching audio URL:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Error fetching audio URL" });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
