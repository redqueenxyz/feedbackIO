// Main Router
const router = require('express').Router(); // create a new instance of Router
var bodyParser = require('body-parser')
var pretty = require('express-prettify');

// Parsing
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// Homepage 
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Connected!' });
});

// Routes
router.use('/webhook', require('./webhook_auth'))
router.use('/webhook', require('./webhook_subscribe')) // Subscriber uses request not express; needs no route technically
router.use('/webhook', require('./facebook_reciever'))
router.use('/webhook', require('./facebook_sender')) // Sender uses request not express; needs no route technically

module.exports = router; // export this index as 'lib/routes'