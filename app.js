var express = require('express');
var path = require('path');
var session = require('express-session');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var LocalStrategy = require('passport-local');
var util = require('util');
var flash = require('connect-flash');
var bcrypt = require('bcrypt');
var routes = require('./routes/index');
var models = require('./models/models');
var User = models.User;
var routes = require('./routes');

var app = express();
var IS_DEV = app.get('env') === 'development';

// Make sure we have all required env vars// to confusing, unpredictable errors later.
['SECRET', 'MONGODB_URI'].forEach(function(el) {
  if (!process.env[el])
    throw new Error("Missing required env var " + el);
});

var certPath = path.join(__dirname, 'Certificates.p12');
if (!IS_DEV) {
  certPath = path.join('/tmp', 'Certificates.p12');
  require('fs').writeFile(certPath, new Buffer(process.env.CERT, 'base64'), (err) => {
    if (err) throw new Error("Unable to write Certificates file", err);
    console.log("Certificates file written.");
  });
}

const exec = require('child_process').exec;

var ParseServer = require('parse-server').ParseServer;
var api = new ParseServer({
  databaseURI: process.env.MONGODB_URI,
  appId: 'PokeParse',
  masterKey: process.env.SECRET,
  serverURL: 'http://localhost:' + (process.env.PORT || 3000) + '/parse',
  push: {
    ios: {
      pfx: certPath,
      passphrase: '',
      bundleId: 'com.horizons.PokegameDitto',
      production: IS_DEV
    }
  }
});

exec('parse-dashboard --appId PokeParse --masterKey ' 
    + process.env.SECRET + ' --serverURL "http://localhost:' 
    + (process.env.PORT || 3000) + '/parse" --appName Ditto', (err, stdout, stderr) => {
      if (err) return console.error(`Failed to start Parse Dashboard process: ${err}`);
      console.log("Started Parse Dashboard, ready.");
})

var server = require('http').Server(app);
var io = require('socket.io')(server);

var socket_routes = require('./routes/socket')

// io.on('connection', socket_routes);

io.on('connection', function(socket) {
  console.log("Setting up socket handlers");
  socket.emit('update', 'lol');
})

if (IS_DEV) {
  mongoose.set('debug', true);
}

app.use(flash());
app.use(logger(IS_DEV ? 'dev' : 'combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/parse', api);

mongoose.connect(process.env.MONGODB_URI);
var mongoStore = new MongoStore({mongooseConnection: mongoose.connection});
app.use(session({
  secret: process.env.SECRET || 'fake secret',
  store: mongoStore
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// passport strategy
passport.use(new LocalStrategy(function(username, password, done) {
  if (! util.isString(username)) {
    done(null, false, {message: 'User must be string.'});
    return;
  }
  // Find the user with the given username
  User.findOne({ username: username }, function (err, user) {
    // if there's an error, finish trying to authenticate (auth failed)
    if (err) {
      console.error(err);
      done(err);
      return;
    }
    // if no user present, auth failed
    if (!user) {
      console.log(user);
      done(null, false, { message: 'Incorrect Username' });
      return;
    }
    // if passwords do not match, auth failed
    bcrypt.compare(password, user.password, function(err, res) {
      // res == true
      if (!res) {
        done(null, false, { message: 'Incorrect Password' });
        return;
      }
      // auth has has succeeded
      done(null, user);
      return;
    });
  });
}));

app.use('/', routes(passport))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (IS_DEV) {
  app.use(function(err, req, res, next) {
    console.error(err.message);
    res.status(err.status || 500);
    res.send("Error: " + err.message + "\n" + err);
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  console.error(err.message, err);
  res.status(err.status || 500);
  res.send("Error: " + err.message);
});

module.exports = app;
