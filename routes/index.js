var bcrypt = require('bcrypt');
var express = require('express');
var models = require('../models/models');
var User = models.User;
var Post = models.Post;
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
              error: err.message
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

  router.get('/feed', function(req, res, next) {
    Post.getRecent(function(err, posts) {
      if (err) return next(err);
      res.json({
        success: true,
        feed: posts
      });
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
