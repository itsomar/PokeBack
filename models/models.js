var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
// Step 0: Remember to add your MongoDB information in one of the following ways!

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
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  team: {
    type: String,
    enum: ['Noteam', 'Mystic', 'Instinct', 'Valor']
  }
});

user.plugin(findOrCreate)

module.exports = {
  Pokemon: mongoose.model('Pokemon', pokemon),
  User: mongoose.model('User', user)
}
