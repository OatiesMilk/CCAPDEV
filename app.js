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
  lname: { type: String },
  bio: { type: String, default: 'No Bio Yet' }
}, { versionKey: false });

const restaurantsSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
    rating: { type: Array },
    address: { type: String },
    logo: { type: String },
    reviews: { type: Array }
}, { versionKey: false });

const accountModel = mongoose.model('account', accountsSchema);
const restaurantModel = mongoose.model('restaurant', restaurantsSchema);
let logged_in = false;
//EDITED--------------------------------------------------------------------------------------
let currentUser = null;

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

async function listRestaurants() {
    return new Promise((resolve, reject) => {
        const resto_list = [];

        restaurantModel.find({}).then(function (restaurants) {
            for (const item of restaurants) {
                let totalRatings = 0;
                for (let i = 0; i < item.rating.length; i++) {
                    totalRatings += item.rating[i];
                }
                let averageRating = totalRatings / item.rating.length;
                averageRating = parseFloat(averageRating.toFixed(1));

                resto_list.push({
                    _id: item._id.toString(),
                    name: item.name,
                    description: item.description,
                    rating: averageRating,
                    address: item.address,
                    logo: item.logo,
                    reviews: item.reviews
                });
            }

            // edited to sort the list by ascending name (default selection)
            resto_list.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

            resolve(resto_list);
        }).catch(errorFn);
    });
}


server.get('/', function(req, resp) {
    listRestaurants().then(resto_list => {
        resp.render('main', {
            layout: 'index',
            title: 'Homepage | SulEAT Food Bites',
            css: 'main',
            restaurant_list: resto_list,
            logged_in: logged_in
        });
    }).catch(errorFn);
});

server.post('/', function(req, resp) {
    listRestaurants().then(resto_list => {
        resp.render('main', {
            layout: 'index',
            title: 'Homepage | SulEAT Food Bites',
            css: 'main',
            restaurant_list: resto_list,
            logged_in: logged_in
        });
    }).catch(errorFn);
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
    listRestaurants().then(resto_list => {
        resp.render('restaurants', {
            layout: 'index',
            title: 'Restaurants',
            restaurant_list: resto_list,
            css: 'restaurants',
            logged_in: logged_in
        });
    }).catch(errorFn);
});

server.post('/gotoReviews', function(req, resp) {
    listRestaurants().then(resto_list => {
        const restaurantName = req.body.restaurantName;
        const matchedRestaurant = resto_list.find(restaurant => restaurant.name === restaurantName);
        const totalReviews = matchedRestaurant.reviews.length;

        resp.render('restaurant_page', {
            layout: 'index',
            title: 'Restaurant Reviews',
            matchedRestaurant: matchedRestaurant,
            css: 'restaurant_page',
            logged_in: logged_in,
            totalReviews: totalReviews
        });
    }).catch(errorFn);
});

// EDITED -----------------------------------------
server.post('/gotoProfileFromResto', function(req, resp){

    resp.render('user_profile', {
        layout: 'index',
        title: 'Profile | SulEAT Food Bites',
        css: 'profile',
        logged_in: logged_in,
        user_fname: currentUser.fname,
        user_lname: currentUser.lname,
        username: currentUser.username,
        bio: currentUser.bio
    });

})
server.post('/gotoRestoFromUser', function(req, resp){
    listRestaurants().then(resto_list => {
        const restaurantName = req.body.restaurantName;
        const matchedRestaurant = resto_list.find(restaurant => restaurant.name === restaurantName);
        const totalReviews = matchedRestaurant.reviews.length;

        resp.render('restaurant_page', {
            layout: 'index',
            title: 'Restaurant Reviews',
            matchedRestaurant: matchedRestaurant,
            css: 'restaurant_page',
            logged_in: logged_in,
            totalReviews: totalReviews
        });
    }).catch(errorFn);
})

server.post('/sortRestaurants', function(req, resp) {
    const sortBy = req.body.sortBy; 
    const orderBy = req.body.orderBy; 

    let sortCriteria = {};
    sortCriteria[sortBy] = orderBy === 'asc' ? 1 : -1; // set sorting criteria based on the selected option
    const resto_list = [];

    restaurantModel.find({}).then(function(restaurants) {
        for (const item of restaurants) {
            let totalRatings = 0;
            for (const rating of item.rating) {
                totalRatings += rating;
            }
            const averageRating = totalRatings / item.rating.length;

            resto_list.push({
                _id: item._id.toString(),
                name: item.name,
                description: item.description,
                rating: averageRating,
                address: item.address,
                logo: item.logo
            });
        }

        // then sort the restaurant list based on sortby criteria
        resto_list.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return -1;
            if (a[sortBy] > b[sortBy]) return 1;
            return 0;
        });

        // apply sorting order (asc/desc)
        if (orderBy === 'desc') {
            resto_list.reverse();
        }

        const response = {
            restaurant_list: resto_list 
        };

        resp.send(response);

    }).catch(errorFn); 
});


server.post('/search', function(req, resp){
    const property = String(req.body.property);
    console.log(property);
})

// -----------------------------------

server.post('/gotoEditAccount', (req, res) => {
    if (!logged_in || !currentUser) {
      res.redirect('/login');
    } else {
      res.render('edit_account', {
        layout: 'index',
        title: 'Edit Account | SulEAT Food Bites',
        css: 'user_settings',
        fname: currentUser.fname,
        lname: currentUser.lname,
        password: currentUser.pass,
        username: currentUser.username,
        email: currentUser.email,
        bio: currentUser.bio,
        profilePicture: currentUser.profilePicture
      });
    }
});

server.post('/updateAccount', function(req, resp) {
    const accountQuery = { fname: currentUser.fname, lname: currentUser.lname }
    const password1 = req.body.password;
    const password2 = req.body.confirm_password;
    const old_pass = req.body.old_password;

    accountModel.findOne(accountQuery).then(function(account) {
        if (password1 === password2 && currentUser.password === old_pass) {
            account.fname = req.body.firstname;
            account.lname = req.body.lastname;
            account.email = req.body.email;
            account.user = req.body.username;
            account.pass = req.body.confirm_password;
            account.bio = req.body.bio;

            account.save().then(function(result) {
                resp.render('login', {
                    layout: 'index',
                    title: 'Account Login',
                    css: 'login'
                });
            }).catch(errorFn);
        } else {
            resp.render('edit_account', {
                layout: 'index',
                title: 'Edit Account | SulEAT Food Bites',
                css: 'user_settings',
                errorMessage: 'Invalid inputs!',
            });
        }
    }).catch(errorFn);
});

server.post('/gotoAccountRegistration', function(req, resp){
    resp.render('register_account', {
        layout: 'index',
        title: 'Account Creation | SulEAT Food Bites',
        css: 'user_registration'
    });
});

server.post('/writeReview', function(req, resp) {
    const restaurantName = req.body.restaurantName;

    resp.render('restaurant_review', {
        layout: 'index',
        title: 'Review Restaurant',
        restaurantName: restaurantName,
        css: 'restaurant_review',
        logged_in: logged_in
    });
});

server.post('/submitReview', function(req, resp) {
    listRestaurants().then(resto_list => {
        const restaurantName = { name: req.body.restaurantName };
        const newRating = parseInt(req.body.ratingInput);
        const newReview = req.body.reviewInput;

        // Find the restaurant by name and update it
        restaurantModel.findOne(restaurantName).then(function(restaurant) {
            restaurant.rating.push(newRating);
            restaurant.reviews.push(newReview);

            restaurant.save().then(function () {
                resp.render('main', {
                    layout: 'index',
                    title: 'Homepage | SulEAT Food Bites',
                    css: 'main',
                    restaurant_list: resto_list,
                    logged_in: logged_in
                });
            })

        }).catch(errorFn);
    }).catch(errorFn);
});

//EDITED--------------------------------------------------------------------------------------
server.post('/gotoProfile', function(req, resp) {
    resp.render('user_profile', {
        layout: 'index',
        title: 'Profile | SulEAT Food Bites',
        css: 'profile',
        logged_in: logged_in,
        currentUser: currentUser
    });
});

server.post('/gotoLogin', function(req, resp) {
    resp.render('login', {
        layout: 'index',
        title: 'Account Login',
        css: 'login'
    });
});

//EDITED--------------------------------------------------------------------------------------
server.post('/verifyLogin', function(req, resp) {
    const loginQuery = {
        user: req.body.username,
        pass: req.body.password
    };

    accountModel.findOne(loginQuery).then(function(login) {
        if (login !== null) {
            logged_in = true;
            console.log('Valid Login!');

            // Set the global current user
            currentUser = {
                fname: login.fname,
                lname: login.lname,
                username: login.user,
                bio: login.bio,
                email: login.email,
                password: login.pass 
            };
            
            // Redirect to the main page instead of rendering the profile
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

//EDITED--------------------------------------------------------------------------------------
server.post('/gotoLogout', function(req, resp) {
    logged_in = false;
    currentUser = null;
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
    const { username, password, email, firstname, lastname, 'confirm-password': confirmPassword, bio  } = req.body;
    const bioValue = 'No Bio Yet';
    // Check if password and confirm password match
    if (password == confirmPassword) {
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
                    lname: lastname,
                    bio: bioValue,
                });

                currentUser = {
                    fname: firstname,
                    lname: lastname,
                    username: username,
                    pass: password,
                    email: email,
                    bio: bioValue
                };
    
                accountInstance.save().then(() => {
                    logged_in = true;
                    resp.render('main', {
                        layout: 'index',
                        title: 'SulEAT Food Bites',
                        css: 'main',
                        logged_in: logged_in
                    });
                    console.log("Successfully registered!");
                }).catch(errorFn);
            }
        }).catch(errorFn);
    } else {
        console.log('Passwords do not match');
        return resp.render('register_account', {
            layout: 'index',
            title: 'Account Creation | SulEAT Food Bites',
            css: 'user_registration',
            error: 'Passwords do not match. Please try again.'
        });
    }
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
