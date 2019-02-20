/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
          
          //complete this one too
          assert.equal(res.status, 200);
          assert.isObject(res.body, 'response should be an object');
          assert.property(res.body, 'stockData', 'response should have \'stockData\' property');
          assert.isObject(res.body.stockData, 'stockData should be an object');
          assert.property(res.body.stockData, 'stock', 'stockData should have \'stock\' property');
          assert.isString(res.body.stockData.stock, 'stock should be a string');
          assert.property(res.body.stockData, 'price', 'stockData should have \'price\' property');
          assert.include(res.body.stockData.price, '.', 'price should be a decimal in string formart');
          assert.property(res.body.stockData, 'likes', 'stockData should have \'likes\' property');
          assert.isNumber(res.body.stockData.likes, 'likes should be an integer');
          done();
        });
      });
      
      test('1 stock with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({stock: 'goog'})
          .end((err, res) => {
            var initLikes = res.body.stockData.likes;
            chai.request(server)
              .get('/api/stock-prices')
              .query({stock: 'goog', like: true})
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.body.stockData.likes - initLikes, 1, 'likes should increament by 1')
                done();
              });
          });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({stock: 'goog'})
          .end((err, res) => {
            var initLikes = res.body.stockData.likes;
            chai.request(server)
              .get('/api/stock-prices')
              .query({stock: 'goog', like: true})
              .end((err, res) => {
                assert.equal(res.status, 200);
                assert.equal(res.body.stockData.likes, initLikes, 'likes before and after should be equal');
                done();
              });
          });
      });
      
      test('2 stocks', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({stock: ['goog', 'msft']})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body.stockData, 'stock should be an array');
            assert.property(res.body.stockData[0], 'rel_likes', 'stock 1 should have \'rel_likes\' property');
            assert.property(res.body.stockData[1], 'rel_likes', 'stock 2 should have \'rel_likes\' property');
            assert.notProperty(res.body.stockData[0], 'likes', 'stock 1 should not have \'likes\' property');
            assert.notProperty(res.body.stockData[1], 'likes', 'stock 2 should not have \'likes\' property');
            done();
          });
      });
      
      test('2 stocks with like', function(done) {
        chai.request(server)
          .get('/api/stock-prices')
          .query({stock: ['goog', 'msft'], like: true})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body.stockData, 'stock should be an array');
            assert.property(res.body.stockData[0], 'rel_likes', 'stock 1 should have \'rel_likes\' property');
            assert.property(res.body.stockData[1], 'rel_likes', 'stock 2 should have \'rel_likes\' property');
            assert.notProperty(res.body.stockData[0], 'likes', 'stock 1 should not have \'likes\' property');
            assert.notProperty(res.body.stockData[1], 'likes', 'stock 2 should not have \'likes\' property');
            done();
          });
      });
      
    });

});
