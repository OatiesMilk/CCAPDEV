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

const restaurantsSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
    rating: { type: Number }
    // logo: { type: Image }
}, { versionKey: false });

const loginModel = mongoose.model('account', accountsSchema);
const restaurantModel = mongoose.model('restaurant', restaurantsSchema);

function errorFn(err){
    console.log('Error found. Please trace!');
    console.error(err);
}

function successFn(res){
    console.log('Database connection successful!');
    console.log(res);
}

const resto_list = [];
restaurantModel.find({}).then(function(restaurants){
    for (const item of restaurants) {
        resto_list.push({
            _id: item._id.toString(),
            name: item.name,
            description: item.description,
            rating: item.rating.toString()
        });
    }

    console.log(resto_list);
}).catch(errorFn);

server.get('/', function(req, resp){
        resp.render('main', {
            layout: 'index',
            title: 'SulEAT Food Bites',
            css: 'main',
            restaurant_list: resto_list
        });
});

server.post('/', function(req, resp){
    resp.render('main', {
        layout: 'index',
        title: 'SulEAT Food Bites',
        css: 'main'
    });
});

server.post('/gotoAboutUs', function(req, resp){
    resp.render('about_us', {
        layout: 'index',
        title: 'About Us',
        css: 'about_us'
    });
});

server.post('/gotoRestaurants', function(req, resp){
    resp.render('restaurants', {
        layout: 'index',
        title: 'Restaurants',
        restaurant_list: resto_list,
        css: 'restaurants'
    });
});

server.post('/gotoProfile', function(req, resp){
    resp.render('user_profile', {
        layout: 'index',
        title: 'Profile | SulEAT Food Bites',
        css: 'profile'
    });
});

server.post('/gotoLogin', function(req, resp){
    resp.render('login', {
        layout: 'index',
        title: 'Login',
        css: 'login'
    });
});

server.post('/gotoLogout', function(req, resp){
    resp.render('main', {
        layout: 'index',
        title: 'SulEAT Food Bites',
        css: 'main'
    });
});

server.post('/gotoRestaurantRegistration', function(req, resp){
    resp.render('register_restaurant', {
        layout: 'index',
        title: 'Restaurant Registration',
        css: 'res_registration'
    });
});

server.post('/registerRestaurant', function(req, resp){
    const registerInstance = restaurantModel({
        name: req.body.res_name,
        description: req.body.res_description,
        rating: req.body.res_rating
        // image: req.body.res_logo
    });

    registerInstance.save().then(function(restaurant){
        resp.render('register_restaurant', {
            layout: 'index',
            title: 'Restaurant Registration',
            css: 'res_registration'
        });
        console.log("Successfully registered!");
    }).catch(errorFn);
});

server.post('/verifyLogin', function(req, resp){
    resp.render('main', {
        layout: 'index',
        title: 'SulEAT Food Bites',
        css: 'main'
    });
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