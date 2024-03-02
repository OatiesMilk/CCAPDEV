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

//Require a MongoDB connection using mongoose. Include the mongoose library
//and feed it the correct url to run MongoDB.
//URL is the database it connects to.
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/CCAPDEV');

//Mongoose will need to define a schema that is used as a template.
//This will contain the model details that is used by the schema.
//the second array is for options. By default, Mongoose adds an extra
//field for versioning. This will be removed.
const accountsSchema = new mongoose.Schema({
  user: { type: String },
  pass: { type: String }
}, { versionKey: false });

const loginModel = mongoose.model('accounts', accountsSchema);

function errorFn(err){
    console.log('Error found. Please trace!');
    console.error(err);
}

function successFn(res){
    console.log('Database query successful!');
}

server.get('/', function(req, resp){
	resp.render('main',{
        layout: 'index',
        title: 'SulEAT Food Bites'
    });
});

server.post('/create-user', function(req, resp) {
    //Creating a new instance can be made this way.
    const loginInstance = loginModel({
        user: req.body.user,
        pass: req.body.pass
    });

    //to save this into the database, call the instance's save function.
    //it will have a call-back to check if it worked.
    loginInstance.save().then(function(accounts) {
        console.log('Account created');
        //change in interface is placed here as only when the query is
        //successful do we update the interface.
        resp.render('result',{
        layout: 'index',
        msg:  'Account created successfully'
        });
    }).catch(errorFn);
});

//Only at the very end should the database be closed.
function finalClose(){
    console.log('Connection closed!');
    mongoose.connection.close();
    process.exit();
}

process.on('SIGTERM',finalClose);  //general termination signal
process.on('SIGINT',finalClose);   //catches when ctrl + c is used
process.on('SIGQUIT', finalClose); //catches other termination commands

const port = process.env.PORT | 3000;
server.listen(port, function() {
    console.log('Listening at port '+port);
});
