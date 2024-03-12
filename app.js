//Install Command:
//npm init
//npm i express express-handlebars body-parser mongoose

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
  pass: { type: String },
  email: {type: String },
  fname: { type: String },
  lname: { type: String }
}, { versionKey: false });

const restaurantsSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
    rating: { type: Number },
    address: { type: String },
    logo: { type: String }
}, { versionKey: false });

const accountModel = mongoose.model('account', accountsSchema);
const restaurantModel = mongoose.model('restaurant', restaurantsSchema);
let logged_in = false;

function errorFn(err) {
    console.log('Error found. Please trace!');
    console.error(err);
}

function successFn(res) {
    console.log('Database connection successful!');
    console.log(res);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const resto_list = [];
restaurantModel.find({}).then(function(restaurant) {
    for (const item of restaurant) {
        resto_list.push({
            _id: item._id.toString(),
            name: item.name,
            description: item.description,
            rating: item.rating,
            address: item.address,
            logo: item.logo
        });
    }

    console.log(resto_list);
}).catch(errorFn);

server.get('/', function(req, resp) {
    resp.render('main', {
        layout: 'index',
        title: 'Homepage | SulEAT Food Bites',
        css: 'main',
        restaurant_list: resto_list,
        logged_in: logged_in
    });
});

server.post('/', function(req, resp) {
    resp.render('main', {
        layout: 'index',
        title: 'Homepage | SulEAT Food Bites',
        css: 'main',
        logged_in: logged_in
    });
});

server.post('/gotoAboutUs', function(req, resp) {
    resp.render('about_us', {
        layout: 'index',
        title: 'About Us',
        css: 'about_us',
        logged_in: logged_in
    });
});

server.post('/gotoRestaurants', function(req, resp) {
    
    resp.render('restaurants', {
        layout: 'index',
        title: 'Restaurants',
        restaurant_list: resto_list,
        css: 'restaurants',
        logged_in: logged_in
    });
});

server.post('/gotoReviews', function(req, resp) {
    const restaurantName = req.body.restaurantName;
    const matchedRestaurant = resto_list.find(restaurant => restaurant.name === restaurantName);

    resp.render('restaurant_page', {
        layout: 'index',
        title: 'Restaurant Reviews',
        matchedRestaurant: matchedRestaurant,
        css: 'restaurant_page',
        logged_in: logged_in
    });
});

server.post('/gotoProfile', function(req, resp) {
    resp.render('user_profile', {
        layout: 'index',
        title: 'Profile | SulEAT Food Bites',
        css: 'profile',
        logged_in: logged_in
    });
});

server.post('/gotoLogin', function(req, resp) {
    resp.render('login', {
        layout: 'index',
        title: 'Account Login',
        css: 'login'
    });
});

server.post('/verifyLogin', function(req, resp) {
    const loginQuery = {
        user: req.body.username,
        pass: req.body.password
    }

    accountModel.findOne(loginQuery).then(function(login) {
        if (login != undefined && login._id != null) {
            logged_in = true; // change value to logged in
            console.log('Valid Login!');
            resp.render('main', {
                layout: 'index',
                title: 'Home | SulEAT Food Bites',
                css: 'main',
                logged_in: logged_in
            });
        } else {
            console.log('Invalid Login!');
            resp.render('login', {
                layout: 'index',
                title: 'Account Login',
                css: 'login',
                error: 'Invalid username or password.'
            }) 
        }
    }).catch(errorFn);
});

server.post('/gotoLogout', function(req, resp) {
    logged_in = false;
    resp.render('main', {
        layout: 'index',
        title: 'SulEAT Food Bites',
        css: 'main',
        logged_in: logged_in
    });
});

server.post('/gotoRestaurantRegistration', function(req, resp){
    resp.render('register_restaurant', {
        layout: 'index',
        title: 'Restaurant Registration',
        css: 'restaurant_forms'
    });
});

server.post('/registerRestaurant', async function(req, resp) {
    const name = capitalize(req.body.res_name.trim());
    // Combine and format the address from separate fields
    const combinedAddress = `${capitalize(req.body.res_street.trim())}, ${capitalize(req.body.res_city.trim())}, ${capitalize(req.body.res_province.trim())}`;

    try {
        const existingRestaurant = await restaurantModel.findOne({
            name: name,
            address: combinedAddress
        });

        if (existingRestaurant) {
            return resp.render('register_restaurant', {
                layout: 'index',
                title: 'Restaurant Registration',
                css: 'restaurant_forms',
                error: 'A restaurant with this name and address already exists.'
            });
        }

        const newRestaurant = new restaurantModel({
            name: name,
            description: req.body.res_description,
            rating: req.body.res_rating,
            address: combinedAddress,
            logo: req.body.res_logo 
        });

        await newRestaurant.save();

        resp.render('main', {
            layout: 'index',
            title: 'Home | SulEAT Food Bites',
            css: 'main',
            logged_in: logged_in,
            message: "Successfully registered the restaurant!"
        });

    } catch (error) {
        console.error('Registration error:', error);
        resp.status(500).render('register_restaurant', {
            layout: 'index',
            title: 'Error Registering Restaurant',
            css: 'restaurant_forms',
            error: 'An unexpected error occurred. Please try again.'
        });
    }
});

server.post('/createAccount', function(req, resp) {
    const { username, password, email, firstname, lastname, 'confirm-password': confirmPassword } = req.body;

    // Check if password and confirm password match
    if (password !== confirmPassword) {
        console.log('Passwords do not match');
        return resp.render('register_account', {
            layout: 'index',
            title: 'Account Creation | SulEAT Food Bites',
            css: 'user_registration',
            error: 'Passwords do not match. Please try again.'
        });
    }

    accountModel.findOne({ user: username }).then(user => {
        if (user) {
            console.log('Username already exists');
            resp.render('register_account', {
                layout: 'index',
                title: 'Account Creation | SulEAT Food Bites',
                css: 'user_registration',
                error: 'Username already exists. Please choose another.'
            });
        } else {
            const accountInstance = new accountModel({
                user: username,
                pass: password,
                email: email,
                fname: firstname,
                lname: lastname
            });

            accountInstance.save().then(() => {
                logged_in = true;
                resp.render('main', {
                    layout: 'index',
                    title: 'SulEAT Food Bites',
                    css: 'main',
                    logged_in: logged_in
                });
                console.log("Successfully registered!");
            }).catch(error => {
                console.error('Error during account creation:', error);
                resp.status(500).render('register_account', {
                    layout: 'index',
                    title: 'Account Creation | SulEAT Food Bites',
                    css: 'user_registration',
                    error: 'An error occurred while creating the account. Please try again.'
                });
            });
        }
    }).catch(errorFn);
});

// Only at the very end should the database be closed.
function finalClose(){
    console.log('Connection closed!');
    mongoose.connection.close();
    process.exit();
}

process.on('SIGTERM',finalClose);  // general termination signal
process.on('SIGINT',finalClose);   // catches when ctrl + c is used
process.on('SIGQUIT', finalClose); // catches other termination commands

const port = process.env.PORT | 3000;
server.listen(port, function() {
    console.log('Listening at port '+port);
});