var mongoose = require('mongoose');

// Step 0: Remember to add your MongoDB information in one of the following ways!
var connect = process.env.MONGODB_URI
mongoose.connect(connect);

//do we need this new??
var pokemon = new mongoose.Schema({
  name: {
      type: String,
      required: true
  },
  types: [{
    type: String,
    required: true
  }],
  number: {
    type: Number,
    required: true
  },
  rarity: {
    type: String,
    required: true
  },
  image: {
    type: String
  }
});

var user = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  team: {
    type: String,
    enum: ['yellow', 'blue', 'red'],
    required: true
  }
});

var post = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pokemon: {
    type: String,
    required: true
  },
  location: {
    latitude: String,
    longitude: String
  },
  time: {
    type: String,
    required: true
  },
  timeout: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  }
})

module.exports = {
  Pokemon: mongoose.model('Pokemon', pokemon),
  User: mongoose.model('User', user),
  Post: mongoose.model('Post', post)
}
