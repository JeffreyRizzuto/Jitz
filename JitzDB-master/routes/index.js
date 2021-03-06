var express = require('express');
var router = express.Router();
var Product = require('../models/product');
var Cart = require('../models/cart');
var Order = require('../models/order');

/** Finds passwords and secrets in the .env file */
var dotenv = require('dotenv');
dotenv.load();

router.get('/', function(req, res, next) {
  res.render('home', { title: 'Jitz' });
});

router.get('/about', function(req, res, next) {
  res.render('about', { title: 'About' });
});

router.get('/locations', function(req, res, next) {
  res.render('locations', { title: 'Locations' });
});

router.get('/gallery', function(req, res, next) {
  res.render('gallery', { title: 'Locations' });
});

router.get('/order', function(req, res, next) {
  res.render('order', { title: 'Order' });
});

// router.get('/hot', function(req, res, next) {
//   // Item.find({'category': 'hot'},function(err, products){
//   // console.log(products);
//   res.render('hot', { title: 'Hot Drinks' });
// });

router.get('/cold', function(req, res, next) {
  res.render('cold', { title: 'Cold Drinks' });
});

router.get('/food', function(req, res, next) {
  res.render('food', { title: 'Food Items' });
});

router.get('/admin', function(req, res, next) {
  res.render('admin', { title: 'Jitz Admin'});
});

/** GET menu page. */
router.get('/menu', function(req, res, next) {

  /** Sets up success message */
  var successMsg = req.flash('success')[0];

  /** Function to display objects */
  Product.find(function(err, docs) {

      var productGroup = [];
      var groupSize = 3;

      /** Pushes objects into array in groups of three and separates them */
      for (var i = 0; i < docs.length; i += groupSize) {
          productGroup.push(docs.slice(i, i + groupSize));
      }
      /** Passes title,products,successMsg,noMessages to shopping cart view */
      res.render('shop/index', { title: 'Shopping Cart', products: productGroup, successMsg: successMsg, noMessages: !successMsg });
  });
});


router.get('/add-to-cart/:id', function(req, res, next) {
    var productId = req.params.id;

    /** If cart exists passes it to session otherwise passes an empty object*/
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    /** Finds product */
    Product.findById(productId, function(err, product) {
       if (err) {
           return res.redirect('/');
       }
        cart.add(product, product.id);
        req.session.cart = cart;
        console.log(req.session.cart);
        res.redirect('/');
    });
});

router.get('/shopping-cart', function(req, res, next) {
   /** Checks if there is a cart in session */
   if (!req.session.cart) {
       return res.render('shop/shopping-cart', {products: null});
   }
    /** Creates a new cart in session */
    var cart = new Cart(req.session.cart);

    /** Passes products and totalPrice to shopping cart view */
    res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

router.get('/reduce/:id', function(req, res, next) {
    var productId = req.params.id;

    /** If cart exists passes it to session otherwise passes an empty object*/
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.reduceByOne(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.get('/increase/:id', function(req, res, next) {
    var productId = req.params.id;

    /** If cart exists passes it to session otherwise passes an empty object*/
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.increaseByOne(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.get('/remove/:id', function(req, res, next) {
    var productId = req.params.id;

    /** If cart exists passes it to session otherwise passes an empty object*/
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.removeItem(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.get('/checkout', isLoggedIn, function(req, res, next) {
    /** Checks if there is a cart in session */
    if (!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    /** Creates a new cart in session */
    var cart = new Cart(req.session.cart);
    var errMsg = req.flash('error')[0];

    /** Passes total, errMsg, and noErr to checkout view */
    res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
});

router.post('/checkout', isLoggedIn, function(req, res, next) {
    /** Checks if there is a cart in session */
    if (!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    /** Creates a new cart in session */
    var cart = new Cart(req.session.cart);

    var stripe = require("stripe")(process.env.SECRET_TEST_KEY);

    /** Creates a new charge */
    stripe.charges.create({
        amount: cart.totalPrice * 100,
        currency: "usd",
        source: req.body.stripeToken, /** obtained with Stripe.js */
        description: "Test Charge"
    }, function(err, charge) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/checkout');
        }

        /** Creates a new order */
        var order = new Order({
            user: req.user,
            cart: cart,
            address: req.body.address,
            name: req.body.name,
            paymentId: charge.id
        });
        order.save(function(err, result) {
            req.flash('success', 'Successfully bought product!');
            req.session.cart = null;
            res.redirect('/');
        });
    });
});


// /** GET menu page. */
// router.get('/hot', function(req, res, next) {
//
//   /** Sets up success message */
//   var successMsg = req.flash('success')[0];
//
//   /** Function to display objects */
//   Product.find(function(err, docs) {
//
//       var productGroup = [];
//       var groupSize = 3;
//
//       /** Pushes objects into array in groups of three and separates them */
//       for (var i = 0; i < docs.length; i += groupSize) {
//           productGroup.push(docs.slice(i, i + groupSize));
//       }
//       /** Passes title,products,successMsg,noMessages to shopping cart view */
//       res.render('hot', { title: 'Hot Drinks', products: productGroup, successMsg: successMsg, noMessages: !successMsg });
//   });
// });
//
//
router.get('/hot', function(req, res, next) {
  console.log('hi');
  Product.find({'category' : 'hot'},function(err, Product){
  console.log(Product);
  res.render('hot', { title: 'Hot Drinks', Product: Product });
});
});



module.exports = router;

/** Requires user to be logged in */
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/users/signin');
}
