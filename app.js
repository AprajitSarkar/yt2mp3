const express = require('express');
const fetch = require('node-fetch');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
ffmpeg.setFfmpegPath(ffmpegPath);
const PORT = process.env.PORT || 3000;

// Create cache directory if it doesn't exist
const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

app.use(cors());
app.use(express.json());

// Clean up cache files older than specified duration
const cacheDuration = parseInt(process.env.CACHE_DURATION) || 3600000; // 1 hour default
setInterval(() => {
    fs.readdir(cacheDir, (err, files) => {
        if (err) return;
        const now = Date.now();
        files.forEach(file => {
            const filePath = path.join(cacheDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                if (now - stats.mtime.getTime() > cacheDuration) {
                    fs.unlink(filePath, () => {});
                }
            });
        });
    });
}, cacheDuration);

// Direct URL-based conversion route
app.get('/:videoUrl(*)', async (req, res) => {
    try {
        const url = req.params.videoUrl;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi,'');
        const outputPath = path.join(cacheDir, `${title}.mp3`);

        const audioStream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' });
        const ffmpegCommand = ffmpeg(audioStream)
            .audioBitrate(320)
            .audioCodec('libmp3lame')
            .audioChannels(2)
            .audioFrequency(44100)
            .format('mp3')
            .on('start', () => {
                console.log('Started FFmpeg conversion...');
            })
            .on('progress', (progress) => {
                console.log(`Processing: ${progress.percent}% done`);
            })
            .on('end', () => {
                console.log('Conversion completed successfully');
                res.download(outputPath, `${title}.mp3`, (err) => {
                    if (err) {
                        console.error('Download error:', err);
                        if (!res.headersSent) {
                            res.status(500).json({ error: 'Download failed', details: err.message });
                        }
                    }
                    // Clean up the file after successful download
                    fs.unlink(outputPath, (unlinkErr) => {
                        if (unlinkErr) console.error('Failed to cleanup file:', unlinkErr);
                    });
                });
            })
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Conversion failed', details: err.message });
                }
                // Clean up any partial files on error
                fs.unlink(outputPath, () => {});
            });

        ffmpegCommand.save(outputPath);

        req.on('close', () => {
            console.log('Client aborted download. Stopping FFmpeg...');
            ffmpegCommand.kill('SIGKILL');
            fs.unlink(outputPath, () => {});
        });
    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// API endpoint to validate YouTube URL
app.post('/api/validate', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        const isValid = ytdl.validateURL(url);
        res.json({ valid: isValid });
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({ error: 'Failed to validate URL' });
    }
});

// API endpoint to get video info
app.post('/api/info', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }
        const info = await ytdl.getInfo(url);
        res.json({
            title: info.videoDetails.title,
            duration: info.videoDetails.lengthSeconds,
            author: info.videoDetails.author.name,
            thumbnail: info.videoDetails.thumbnails[0].url
        });
    } catch (error) {
        console.error('Info error:', error);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

// API endpoint to convert and download MP3
app.post('/api/convert', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi,'');
        const outputPath = path.join(cacheDir, `${title}.mp3`);

        const audioStream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' });
        const ffmpegCommand = ffmpeg(audioStream)
            .audioBitrate(320)
            .audioCodec('libmp3lame')
            .audioChannels(2)
            .audioFrequency(44100)
            .format('mp3')
            .on('start', () => {
                console.log('Started FFmpeg conversion...');
            })
            .on('progress', (progress) => {
                console.log(`Processing: ${progress.percent}% done`);
            })
            .on('end', () => {
                console.log('Conversion completed successfully');
                res.download(outputPath, `${title}.mp3`, (err) => {
                    if (err) {
                        console.error('Download error:', err);
                        if (!res.headersSent) {
                            res.status(500).json({ error: 'Download failed', details: err.message });
                        }
                    }
                    // Clean up the file after successful download
                    fs.unlink(outputPath, (unlinkErr) => {
                        if (unlinkErr) console.error('Failed to cleanup file:', unlinkErr);
                    });
                });
            })
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Conversion failed', details: err.message });
                }
                // Clean up any partial files on error
                fs.unlink(outputPath, () => {});
            });

        ffmpegCommand.save(outputPath);

        req.on('close', () => {
            console.log('Client aborted download. Stopping FFmpeg...');
            ffmpegCommand.kill('SIGKILL');
            fs.unlink(outputPath, () => {});
        });
    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
});
