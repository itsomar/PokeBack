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

module.exports = {
  Pokemon: mongoose.model('Pokemon', pokemon)
}
