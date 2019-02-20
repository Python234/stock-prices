/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

var DB;

MongoClient.connect(CONNECTION_STRING, (err, db) => DB = db);

module.exports = function (app) {

  app.route('/api/stock-prices/')
    .get(function (req, res){
      var items = DB.collection('items');
      if (typeof req.query.stock === 'string') {
        if (req.query.hasOwnProperty('like')) {
          likeItem({stock: req.query.stock, ip: req.ip}, res);
        }
        else {
          items.findOne({stock: req.query.stock}, {_id: 0}, (err, doc) => {
            if (err) res.status(500).send(err.message);
            else {
              if (doc) res.json({stockData: doc});
              else {
                var price = random();
                items.insertOne({stock: req.query.stock, price: price, likes: 0}, (err, doc) => {
                  if (err) res.status(500).send(err.message);
                  else res.json({stockData: {stock: req.query.stock, price: price, likes: 0}})
                });
              }
            }
          });
        }
      }
      else {
        var stock = [];
        if (req.query.hasOwnProperty('like')) {
          var userLikes = DB.collection('likes');
          
          userLikes.findOne({stock: req.query.stock[0], ip: req.ip}, (err, doc) => {
            if (err) return res.status(500).send(err.message);
            if (doc) {
              items.findOne({stock: req.query.stock[0]}, (err, doc) => {
                if (err) res.status(500).send(err.message);
                else {
                  stock.push({stock: doc.stock, price: doc.price, rel_likes: doc.likes});
                  nextItem(stock, req, res);
                }
              });
            } else {
              items.findOneAndUpdate({stock: req.query.stock[0]},
                                     {$inc: {likes: 1}},
                                     {returnOriginal: false,
                                      projection: { _id: 0 }}, (err, doc) => {
                if (err) res.status(500).send(err.message);
                else if (doc.value) {
                  stock.push({stock: doc.value.stock, price: doc.value.price, rel_likes: doc.value.likes});
                  nextItem(stock, req, res);
                }
                else {
                  var price = random();
                  items.insertOne(
                    {
                      stock: req.query.stock[0],
                      price: price,
                      likes: 1
                    },
                    (err, doc) => {
                      if (err) res.status(500).send(err.message);
                      else {
                        stock.push({stock: req.query.stock[0], price: price, rel_likes: 1});
                        nextItem(stock, req, res);
                      }
                    });
                }
              });
            }                    
          })
        } else {
          items.findOne({stock: req.query.stock[0]}, (err, doc) => {
            if (err) return res.status(500).send(err.message);
            if (doc) {
              stock.push({stock: doc.stock, price: doc.price, rel_likes: doc.likes});
              nextItemNoLike(stock, req, res);
            } else {
              var price = random();
              items.insertOne(
                {
                  stock: req.query.stock[0],
                  price: price,
                  likes: 0
                }, (err, doc) => {
                  stock.push({stock: req.query.stock[0], price: price, rel_likes: 0});
                  nextItemNoLike(stock, req, res);
                });
            }
          });
        }
      }
    });
  
  var likeItem = (obj, res) => {
    var userLikes = DB.collection('likes');
    var items = DB.collection('items');
    userLikes.findOne({stock: obj.stock, ip: obj.ip}, (err, doc) => {
      if (err) res.status(500).send(err.message);
      else if (doc) {
        items.findOne({stock: obj.stock}, {_id: 0}, (err, doc) => {
          if (err) res.status(500).send(err.message);
          else res.json({stockData: doc});
        });
      } else {
        userLikes.insertOne({stock: obj.stock, ip: obj.ip}, (err, doc) => {
          items.findOneAndUpdate({stock: obj.stock},
                                 {$inc: {likes: 1}},
                                 {returnOriginal: false,
                                 projection: {_id: 0}}, (err, doc) => {
            if (err) return res.status(500).send(err.message);
            if (doc.value) res.json({stockData: doc.value});
            else {
              var price = random();
              items.insertOne({
                stock: obj.stock,
                price: price,
                likes: 1
              },(err, doc) => {
                if (err) res.status(500).send(err.message);
                else res.json({stockData: {stock: obj.stock, price: price, likes: 1}});
              });
            }
          });
        });
      }
    });
  }
  
  var nextItem = (stock, req, res) => {
    var userLikes = DB.collection('likes');
    var items = DB.collection('items');
    userLikes.findOne({stock: req.query.stock[1], ip: req.ip}, (err, doc) => {
      if (err) return res.status(500).send(err.message);
      if (doc) {
        items.findOne({stock: req.query.stock[1]}, (err, doc) => {
          if (err) return res.status(500).send(err.message);
          if (doc) {
            stock.push({stock: doc.stock, price: doc.price, rel_likes: doc.likes - stock[0].rel_likes});
            res.json({stockData: stock});
          }
        });
      } else {
        userLikes.insertOne({stock: req.query.stock[1], ip: req.ip}, (err, doc) => {
          items.findOneAndUpdate({stock: req.query.stock[1]},
                                 {$inc: {likes: 1}},
                                 {returnOriginal: false,
                                 projection: {_id: 0}}, (err, doc) => {
            if (err) return res.status(500).send(err.message);
            if (doc.value) {
              stock.push({stock: doc.value.stock, price: doc.value.price, rel_likes: doc.value.likes - stock[0].rel_likes});
              res.json({stockData: stock});
            } else {
              var price = random();
              items.insertOne(
                {
                  stock: req.query.stock[1],
                  price: price,
                  likes: 1
                }, (err, doc) => {
                  if (err) return res.status(500).send(err.message);
                  stock.push({stock: req.query.stock[1], price: price, rel_likes: 1 - stock[0].rel_likes});
                  res.json({stockData: stock});
                });
            }
          });
        });
      }
    });
  };
  
  var nextItemNoLike = (stock, req, res) => {
    var items = DB.collection('items');
    items.findOne({stock: req.query.stock[1]}, (err, doc) => {
      if (err) return res.status(500).send(err.message);
      if (doc) {
        stock.push({stock: doc.stock, price: doc.price, rel_likes: doc.likes - stock[0].rel_likes});
        res.json({stockData: stock});
      } else {
        var price = random();
        items.insertOne(
          {
            stock: req.query.stock[1],
            price: price,
            likes: 0
          }, (err, doc) => {
            if (err) return res.status(500).send(err.message);
            stock.push({stock: req.query.stock[1], price: price, rel_likes: -stock[0].rel_likes});
            res.json({stockData: stock});
          });
      }
    });
  };
  
  var random = () => {
    var price = Math.floor((Math.random() * 9 + 1) * 100.0) / 100.0
    return price + '';
  };
    
};
