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
  }
  // team: {
  //   type: String,
  //   enum: ['Noteam', 'Mystic', 'Instinct', 'Valor'],
  //   required: true
  // }
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

post.statics.getRecent = function(cb) {
  this.model('Post').find({timeout: {$gt: Date.now()}})
      .lean()
      .sort({timeout: 1})
      .populate('user')
      // .limit LATER
      .exec(cb)
}

post.methods.getRating = function(cb) {
  this.model('Rating').find({post: this._id}, function(err, ratings) {
    if (err) return cb(err, null)
    if (ratings) {
      var rating = ratings.reduce(function(prevNumber, currRating) {
        var num = (currRating.type === 'down') ? -1 : 1
        return prevNumber + num;
      }, 0)
      return cb(err, rating);
    }
  });
}

var rating = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  type: {
    type: String,
    enum: ['up', 'down'],
    required: true
  }
})

module.exports = {
  Pokemon: mongoose.model('Pokemon', pokemon),
  User: mongoose.model('User', user),
  Post: mongoose.model('Post', post),
  Rating: mongoose.model('Rating', rating)
}
