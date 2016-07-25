var bcrypt = require('bcrypt');
var express = require('express');
var models = require('../models/models');
var User = models.User;
var Post = models.Post;
var Rating = models.Rating;
var Pokemon = models.Pokemon;

var _ = require('underscore');

module.exports = function (passport) {
var router = express.Router();

  /* Authentication routes */

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
    var params = _.pick(req.body, ['username', 'password', 'team']);
    bcrypt.genSalt(10, function(err, salt) {
      console.log("salt err", err);
      bcrypt.hash(params.password, salt, function(err, hash) {
        console.log("hash error", err);
        // Store hash in your password DB.
        params.password = hash;
        User.create(params, function(err, user) {
          console.log("user err", err)
          if (err) {
            console.log(err);
            res.status(400).json({
              success: false,
              error: 'Username is taken'
            });
          } else {
            res.json({
              success: true,
              user: user
            });
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
    res.json({
      success: true,
      user: user
    });
  });

  router.post('/post', function(req, res, next) {
    new Post({
      user: req.user,
      pokemon: req.body.pokemon,
      time: new Date(),
      location: {
        latitude: req.body.latitude,
        longitude: req.body.longitude
      },
      timeout: new Date().getTime() + (30 * 60 * 1000),
    }).save(function(err,post) {
      if (err) return next(err);
      res.json(post)
    });
  });

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
    Post.getRecent(function(err, posts) {
      if (err) return next(err);
      posts.map(function(post, i) {
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
      
    });
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
      res.json({
        success: true,
        pokemon: pokemon
      });
    });
  });

  return router;
};
