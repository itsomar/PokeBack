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
    type: Date,
    required: true
  },
  timeout: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  }
})

post.methods.getRecent = function(cb) {
  // this.sort(timeout).find({
  //   $gt: { timeout: new Date().getTime() }
  // }).exec(cb);
  this.find({timeout: {$gt: Date.now()}})
      .sort({timeout: -1})
      .exec(cb)
}

module.exports = {
  Pokemon: mongoose.model('Pokemon', pokemon),
  User: mongoose.model('User', user),
  Post: mongoose.model('Post', post)
}
