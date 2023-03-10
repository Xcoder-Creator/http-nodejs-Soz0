require('dotenv').config(); // Import and configure dotenv module
const express = require('express'); // Import express module
const student_routes = require('./routes/student.routes'); // Import student routes
const driver_routes = require('./routes/driver.routes'); // Import driver routes
const bodyParser = require('body-parser');
const url = require('url');
const student_event = require('./ws_controller/student_event.ws');
const { WebSocketServer } = require('ws');
const driver_event = require('./ws_controller/driver_event.ws');
const sockserver = new WebSocketServer({ port: 5000, path: '/api/rides' })

const app = express(); // Use the express module

app.set('view engine', 'ejs'); // Register view engine of choice. Eg: Ejs

app.use(express.static('public')); // Middleware to allow static files to be served from only the public folder

app.use(express.urlencoded({ extended: true })); // This will parse data recieved from a html form and put it in json format

// Parse JSON request bodies
app.use(bodyParser.json());

// Parse URL-encoded request bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/student', (req, res) => {
    res.sendFile('views/student.html', {root: __dirname })
});

app.get('/driver', (req, res) => {
  res.sendFile('views/driver.html', {root: __dirname })
});

app.use('/api/v1/student', student_routes); // Students api module
app.use('/api/v1/driver', driver_routes); // Drivers api module

sockserver.on('connection', (socket, req) => {
  var token = url.parse(req.url, true).query.auth_token // Auth token

  console.log('A client connected');

  var interval;

  socket.on('message', (message) => {
    if (JSON.parse(message).event === 'student_event'){
      interval = setTimeout(async () => {
        var student_event_obj = await student_event(token);
        
        if (student_event_obj.status === true){
          var obj = {
            status: true,
            auth_person: 'student',
            new_notifications: student_event_obj.new_notifications
          }
  
          socket.send(JSON.stringify(obj));
        } else if (student_event_obj.status === false){
          var obj = {
            status: false,
            auth_person: 'student',
          }
  
          socket.send(JSON.stringify(obj));
        }
      }, 3000);
    } else if (JSON.parse(message).event === 'driver_event'){
      interval = setTimeout(async () => {
        var driver_event_obj = await driver_event(token);
        
        if (driver_event_obj.status === true){
          var obj = {
            status: true,
            auth_person: 'driver',
            new_notifications: driver_event_obj.new_notifications
          }
  
          socket.send(JSON.stringify(obj));
        } else if (driver_event_obj.status === false){
          var obj = {
            status: false,
            auth_person: 'driver',
          }
  
          socket.send(JSON.stringify(obj));
        }
      }, 3000);
    }
  });

  socket.on('close', () => {
    console.log('A client disconnected');
    clearTimeout(interval);
  });
});

// 404 Error handler
app.use((req, res, err) => {
    res.statusCode = 404;
    res.json({ error_code: 50, error_msg: 'Endpoint not found!' });
});
//-----------------------

app.listen(3000 || process.env.PORT_NUMBER); // Server listening at port 3000
