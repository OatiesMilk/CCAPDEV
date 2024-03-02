const express = require('express');
const server = express();

const bodyParser = require('body-parser');
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

const handlebars = require('express-handlebars');
server.set('view engine', 'hbs');
server.engine('hbs', handlebars.engine({
    extname: 'hbs',
}));

server.use(express.static('public'));

// Require a MongoDB connection. This will create a client
// to connect to the specified mongoDB. The last part of the
// URL is the database it connects to.
const { MongoClient } = require('mongodb');
const databaseURL = "mongodb://127.0.0.1:27017/";
const mongoClient = new MongoClient(databaseURL);

const databaseName = "CCAPDEV";
const collectionName = "accounts";

function errorFn(err){
    console.log('Error found. Please trace!');
    console.error(err);
}

function successFn(res){
    console.log('Database query successful!');
}

mongoClient.connect().then(function(con){
  console.log("Attempt to create!");
  const dbo = mongoClient.db(databaseName);
  dbo.createCollection(collectionName)
    .then(successFn).catch(errorFn);
}).catch(errorFn);

server.get('/', function(req, resp){
	resp.render('main',{
        layout: 'index'
    });
});

server.post('/create-user', function(req, resp) {
    const dbo = mongoClient.db(databaseName);
    const col = dbo.collection(collectionName);

    const info = {
        user: req.body.user,
        pass: req.body.pass
    }

    col.insertOne(info).then(function(res) {
        console.log('Account created!');

        resp.render('login', {
            layout: 'index'
        })
    }).catch(errorFn);
});

const port = process.env.PORT | 9090;
server.listen(port, function() {
    console.log('Listening at port '+port);
});
