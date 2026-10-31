const express = require('express');
require('dotenv').config();
const app = express();
app.get('/api/clan', require('./api/clan.js'));
app.get('/api/player', require('./api/player.js'));
app.use(express.static(__dirname));
app.listen(3000, () => console.log('http://localhost:3000'));
