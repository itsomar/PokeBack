var bcrypt = require('bcrypt');
var express = require('express');
var models = require('../models/models');
// const api = require('pokemon-go-api');
    // "pokemon-go-api": "0.0.11",

var User = models.User;
var Post = models.Post;
var Gympost = models.Gympost;
var Rating = models.Rating;
var Pokemon = models.Pokemon;
var request = require('request-promise');

var _ = require('underscore');

var Parse = require('parse/node');
Parse.initialize("PokeParse");
Parse.serverURL = "http://pokeconnect.herokuapp.com/parse";

module.exports = function (passport) {
var router = express.Router();

  /* Authentication routes */

//   router.get('/pokemonGoApi', function(req, res) {
//     // const username = 'username';
//     // const password = 'password';
//     //
//     //
//     // const provider = 'google';
//     // const location = 'Pennsylvania';
//     //
//     // // main code
//     // api.login(username, password, provider)
//     //   .then(function() {
//     //     console.log("SECOND");
//     //     console.log("THIRD");
//     //     return api.location.set('address', location)
//     //       .then(api.getPlayerEndpoint);
//     //   })
//     //   .then(api.profile.get)
//     //   .then(function(profile) {
//     //     console.log('success', profile);
//     //   })
//     //   .catch(function(error) {
//     //     console.log('error', error.stack);
//     //   });
//
//
//
//     const username = '';
//     const password = '';
//
//     const provider = 'google';
//
// // main code
//     api.login(username, password, provider)
//       .then(api.getPlayerEndpoint)
//       .then(_.partial(api.mapData.getByCoordinates, 39.955469, -75.196910))
//       .then(function(data) {
//         console.log('success', data);
//       })
//       .catch(function(error) {
//         console.log('error', error.stack);
//       });
//
//
//       res.send("DOPE!")
//     })


  router.get('/login/failure', function(req, res) {
    res.status(401).json({
      success: false,
      error: req.flash('error')[0]
    });
  });

  router.post('/login', passport.authenticate('local', {
    successRedirect: '/login/success',
    failureRedirect: '/login/failure',
    failureFlash: true
  }));

  router.post('/register', function(req, res, next) {
    // if (!req.body.username || !req.body.password || !req.body.confirm) {
    //   return res.json({
    //     success: false,
    //     error: 'Missing fields'
    //   })
    // }
    // if (req.body.password !== req.body.confirm) {
    //   return res.json({
    //     success: false,
    //     error: 'Passwords do not match'
    //   })
    // }

    var params = _.pick(req.body, ['username', 'password', 'repassword', 'team', 'token']);

    if (params.team === ''){
        return res.status(400).json({
          success: false,
          error: 'Select a Team'
        });
    }
    if (params.password.length  < 4){
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 4 characters long'
        });
    }
    if (!params.username){
      return res.status(400).json({
          success: false,
          error: 'Enter a username'
      })
    }
    if (params.password !== params.repassword){
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      })
    }
    if (!params.token) {
      return res.status(400).json({
        success: false,
        error: 'No device token supplied'
      })
    }
    bcrypt.genSalt(10, function(err, salt) {
      console.log("salt err", err);
      bcrypt.hash(params.password, salt, function(err, hash) {
        console.log("hash error", err);
        // Store hash in your password DB.
        params.password = hash;
        console.log("user err", err)
                // if there's an error, finish trying to authenticate (auth failed)
        request({
          uri: Parse.serverURL + "/installations?where=" 
              + encodeURIComponent(JSON.stringify({ deviceToken: params.token })),
          headers: {
            'X-Parse-Application-Id': 'PokeParse',
            'X-Parse-Master-Key': process.env.SECRET
          }
        }).then(response => {
          var parsed = JSON.parse(response);
          console.log(parsed.results[0])
          request({
            uri: Parse.serverURL + "/installations/" + parsed.results[0].objectId,
            method: 'PUT',
            headers: {
              'X-Parse-Application-Id': 'PokeParse',
              'X-Parse-Master-Key': process.env.SECRET,
              'Content-Type': 'application/json'
            },
            form: {
              "channels": [].concat(parsed.results[0].channels, params.username)
            }
          })
        }).then(response => {
          console.log("Parse succeeded", response);
          new User({
            username: params.username,
            password: params.password,
            team: params.team,
            token: params.token
          }).save(function(error, user){
            if(error){
              return res.status(400).json({
                success: false,
                error: "Username already exists"
              })
            }
              else{
                return res.json({
                  success: true,
                  user: user
                })
              }
          });
        }).catch(err => next(err));
      });
    });
  });

  // Beyond this point the user must be logged in
  router.use(function(req, res, next) {
    if (!req.isAuthenticated()) {
      res.status(401).json({
        success: false,
        error: 'not authenticated'
      });
    } else {
      next();
    }
  });
  router.get('/logout', function(req, res) {
    req.logout();
    res.json({
      success: true,
      message: 'logged out.'
    });
  });

  router.get('/login/success', function(req, res) {
    var user = _.pick(req.user, 'username', '_id');
    console.log("NOTIFFF", req.user.notif);
    res.json({
      success: true,
      user: user,
      notif: req.user.notif
    });
  });

  router.post('/post', function(req, res, next) {
    console.log("Attempting to post " + req.body.pokemon + " from " + req.user.username);
    console.log("POKEMON OBJECTTTT", req.body.pokemonObject);
    new Post({
      user: req.user,
      pokemon: req.body.pokemon,
      pokemonObject: req.body.pokemonObject._id,
      time: new Date(),
      geo: [req.body.longitude,req.body.latitude],
      timeout: new Date().getTime() + (30 * 60 * 1000)
    }).save().then((post) => {
      console.log("Saving succeeded: ", post);
      return res.json({
        success: true,
        post: post
      });
    }).then(() => {
      return User.find({
        geo: { 
          $nearSphere: [req.body.longitude,req.body.latitude],
          $maxDistance: 0.001
        },
        notif: {
          $elemMatch: req.body.pokemon
        }
      });
    }).then(users => {
        console.log("NEARBY USERS DETECTED", users);
        if (users.length === 0) return;
        return Parse.Push.send({
          channels: users.map(user => user.username),
          data: {
            alert: "A " + req.body.pokemon + " has been spotted near you!"
          }
        });
    }).catch(err => next(err));
  });

  router.post('/gympost', function(req, res, next) {
    console.log("USERBROOO", req.user)
    console.log("USER TEAM BROOOO", req.user.team)

    new Gympost({
      user: req.user,
      message: req.body.message,
      time: new Date(),
      team: req.user.team,
      geo: [req.body.longitude,req.body.latitude],
      timeout: new Date().getTime() + (15 * 60 * 1000),
    }).save(function(err,post) {
      if (err) return next(err);
      res.json(post)
    });
  });

  router.post('/notif', function(req, res) {
    console.log("RE USER NOT", req.user.notif);
      for(var i = 0; i < req.user.notif.length; i++) {
        console.log("INSIDE FOR LOOP GEORGE");
        if(req.body.pokemon === req.user.notif[i]) {
          return res.json({
            success: false
          })
        }
      }
      req.user.notif = req.user.notif.concat(req.body.pokemon)
      req.user.save(function(err, user) {
        res.json({
          success: true,
          notif: user.notif
        })
      })
    })

  router.get('/post/:id', function(req, res, next) {
    console.log('DID I MAKE IT HERE MANGG')
    Rating.findOne({user: req.user._id, post: req.params.id}, function(err, rating){
      if (err) return next(err);
      if (rating) {
        console.log('[RATING]', rating)
        if (rating.type === 'up') {
          res.json({
            success: true,
            rating: 'up'
          });
        } else {
          res.json({
            success: true,
            rating: 'down'
          });
        }
      } else {
        res.json({
          success: false,
          rating: 'none'
        });
      }
    });
  });

  router.post('/background', function(req, res, next) {
    console.log("Updating user location", req.body);
    req.user.geo = [parseFloat(req.body.location.coords.longitude), parseFloat(req.body.location.coords.latitude)];
    req.user.save()
      .then(user => {
        res.send(user);
        return true;
      })
      .then(() => {
        console.log("Made it here!");
        return Post.find({
          name: {
            $in: req.user.notif
          },
          geo: { 
            $nearSphere: [req.body.location.coords.longitude, req.body.location.coords.latitude],
            $maxDistance: 0.001
          },
        });
      })
      .then(posts => {
        console.log("NEARBY POSTS DETECTED", posts);
        posts.forEach(post => {
          Parse.Push.send({
            channels: req.user.username,
            data: {
              alert: "A " + post.pokemon + " has been spotted near you!"
            }
          });
        });
      })
      .catch(err => next(err));
  })

  router.post('/post/:id', function(req, res, next) {
    Post.findById(req.params.id, function(err, post) {
      Rating.findOne({
        user: req.user._id,
        post: req.params.id}, function(err, r) {
          if (err) {
            console.log(err);
            return res.status(400).json({
              success: false,
              message: err
            });
          }
          // if user has voted
          if (r) {
            if (req.body.vote !== r.type) {
              // switch rating
              if (r.type === 'up') {
                r.type = 'down'
                post.rating -= 2;
              } else if (r.type === 'down') {
                r.type = 'up';
                post.rating += 2;
              }
              r.save(function(err, r) {
                if (err) {
                  console.log(err);
                  return res.status(400).json({
                    success: false,
                    message: err
                  });
                }
                post.save(function(err, p) {
                    return res.json({
                      success: true,
                      rating: p.rating
                    })
                  })
                })
              } else {
                // delete rating
                Rating.remove({ _id: r._id}, function(err) {
                  if (err) {
                    console.log(err);
                    return res.status(400).json({
                      success: false,
                      message: err
                    });
                  }

                  if (r.type === 'up') {
                    post.rating -= 1;
                  } else {
                    post.rating += 1;
                  }
                  post.save(function(err, p) {
                      return res.json({
                        success: true,
                        rating: p.rating
                    })
                  })
                })
              }
            } else {
              // if have not voted, create new rating
              var rating = new Rating({
                post: req.params.id,
                user: req.user._id,
                type: req.body.vote
              })
              rating.save(function(err, r) {
                if (err) {
                  console.log(err);
                  return res.status(400).json({
                    success: false,
                    message: err
                  });
                }
                if (r.type === 'up') {
                  post.rating += 1;
                } else {
                  post.rating -= 1;
                }
                post.save(function(err) {
                  if (err) return next(err);
                  res.json({
                    success: true,
                    rating: post.rating
                  })
                })
              })
            }
          })
        })
      })

  router.get('/feed', function(req, res, next) {
    console.log('[INSIDE FEEDGHIBB]')
    var coord = [parseFloat(req.query.longitude),parseFloat(req.query.latitude)]
    req.user.latitude = req.query.latitude
    req.user.longitude = req.query.longitude
    Post.findNearRecent(coord, function(err, posts) {
      console.log('[INSIDE GEORGEEE]')
      console.log("ERRRRRRR", err);
      if (err) return next(err);
      if (posts.length === 0) {return res.json({success: true, feed: []})}
      console.log('[INSIDE IF STTEMME')
      // var notif = req.user.notif.filter(function(item) {
      //   if(item === "Uncommon") {
      //      return item
      //   }
      //   else if(item === "Rare") {
      //      return item
      //   }
      //   else if(item === "Super Rare") {
      //      return item
      //   } else {
      //     return null
      //   }
      // })
      // if(notif) {
      //   var postnotif = posts.filter(function(item) {
      //     return item.pokemonObject.rarity =
      //   })
      // }
       posts.map(function(post, i) {
        console.log("INSIDE MAP");
        post.location = {}
        post.location.latitude = post.geo[1];
        post.location.longitude = post.geo[0];
        Rating.findOne({ post: post._id, user: req.user._id }, function(err, r) {
          if (r) {
            post.vote = r.type;
          }
          if (i === posts.length - 1) {
            console.log(posts);
            res.json({
              success: true,
              feed: posts
            });
          }
          return post
        })
      })

    })
    ;
  });

  router.get('/gymfeed', function(req, res, next) {
    var coord = [parseFloat(req.query.longitude),parseFloat(req.query.latitude)]
    Gympost.findNearRecent(coord, function(err, posts) {
      console.log("LOOK POSTS", posts)
      if (err) return next(err);
      if (posts.length === 0) return res.json({success: true, feed: []});
      posts.map(function(post, i) {
        post.location = {}
        post.location.latitude = post.geo[1];
        post.location.longitude = post.geo[0];
        if (i === posts.length - 1) {
          console.log("LOGGING", posts);
          res.json({
            success: true,
            feed: posts
          });
        }
        return post
      })
    })
  });

  router.get('/pokemon', function(req, res, next) {
    Pokemon.find()
           .sort({name: 1})
           .exec(function(err, pokemons) {
      if (err) return next(err);
      res.json({
        success: true,
        pokemon: pokemons
      });
    });
  });

  router.get('/pokemon/:name', function(req, res, next) {
    Pokemon.findOne({name: req.params.name}, function(err, pokemon) {
      if (err) return next(err);
      if (pokemon === null) return res.json({success: true, feed: []});
      res.json({
        success: true,
        pokemon: pokemon
      });
    });
  });

  router.get('/user', function(req, res, next) {
    User.findById(req.user._id, function(err, user) {
      if (err) return next(err);
      res.json({
        success: true,
        user: user
      });
    });
  });

  return router;
};
