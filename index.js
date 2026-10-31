const express = require('express');
const path = require('path');
require('dotenv').config();
const app = express();
const pub = path.join(__dirname, 'public');

app.get('/stats', (req, res) => res.sendFile(path.join(pub, 'stats.html')));
app.get('/api/clan', require('./api/clan.js'));
app.get('/api/player', require('./api/player.js'));
app.use(express.static(pub)); // serves / as index.html automatically

app.listen(process.env.PORT || 3000, () => console.log('http://localhost:3000'));