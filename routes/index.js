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

var _ = require('underscore');

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

    var params = _.pick(req.body, ['username', 'password', 'repassword', 'team']);
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
    bcrypt.genSalt(10, function(err, salt) {
      console.log("salt err", err);
      bcrypt.hash(params.password, salt, function(err, hash) {
        console.log("hash error", err);
        // Store hash in your password DB.
        params.password = hash;
        console.log("user err", err)
                // if there's an error, finish trying to authenticate (auth failed)
        new User({
          username: params.username,
          password: params.password,
          team: params.team
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
    }).save(function(err,post) {
      console.log("Saving attempted: ", err, post);
      if (err) return next(err);
      res.json({
        success: true,
        post: post
      })
    });
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

  router.post('/background', function(req, res) {
    console.log("REQBODY", req.body);
    req.user.latitude = req.body.location.coords.latitude;
    req.user.longitude = req.body.location.coords.longitude
    res.send("DOPE")
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
