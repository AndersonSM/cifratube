const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

require('./app/models/db');

const routesAPI = require('./app/routers/index');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.set('port', process.env.PORT || 8080);

const server = app.listen(app.get('port'), function ()  {
    console.log(`Serving TCC on port ${app.get('port')}...`);
});

app.use('/api', routesAPI);

// TODO: change to front
app.get('/', function (req, res) { res.render('index'); });
app.get('*', function (req, res) { res.sendfile('./front/dist/index.html'); });

module.exports = app;