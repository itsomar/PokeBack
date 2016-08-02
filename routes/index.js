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
var Notification = models.Notification;

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

  router.get('/notifications', function(req, res){
    Notification.remove({timeout:  {$lt: new Date().getTime()}}, function(err) {
      console.log("err", err)
      Notification.find({team: req.user.team}, function(err, notification){
        res.json({
          success: true,
          notifications: notification
          })
      })
    });
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
      geo: [req.body.longitude,req.body.latitude],
      timeout: new Date().getTime() + (30 * 60 * 1000),
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
<<<<<<< HEAD
    console.log("USERBROOO", req.user)
    console.log("USER TEAM BROOOO", req.user.team)
    console.log(new Date().getTime());

      
    //   for(var count = 0; count < notification.length; count = count + 1){

    //   console.log("length: " + notification.length);
    //   console.log("count: " + count);
    //   // console.log("notification: " + notification[count].timeout);
    //   // console.log(new Date().getTime())
    //   // console.log("below");
    //   if(notification[count].timeout < new Date().getTime())
    //     {
    //       console.log('hi')
    //       notification[count].remove();
    //       count --; 
    //     }
        
    //   }
    // })

    new Notification({
=======
    new Gympost({
      user: req.user,
>>>>>>> master
      message: req.body.message,
      team: req.user.team,
      timeout: new Date().getTime() + 58732
    }).save(function(error, notification){
      if(error) return next(error);
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
    })
    // res.sendStatus(200)
    
  });

  router.post('/notif', function(req, res) {
    User.findByIdAndUpdate(req.user._id, {$push: {notif: req.body.pokemon}},function(err, user) {
      if(err) {
        return next(err)
      }
      else {
        res.json({
          success: true,
          notif: user.notif
        })
      }
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
    // console.log('[HOW MANY TIMES AM I GETTING REQUESTS?????????]')
    var coord = [parseFloat(req.query.longitude),parseFloat(req.query.latitude)]
    Post.findNearRecent(coord, function(err, posts) {
      if (err) return next(err);
      if (posts.length === 0) return res.json({success: true, feed: []});
      posts.map(function(post, i) {
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
