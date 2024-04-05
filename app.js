//Install Command:
//npm init
//npm i express express-handlebars body-parser mongoose bcrypt express-session connect-mongodb-session

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
mongoose.connect('mongodb+srv://andreiviguilla:test123@ccapdev.ka765zq.mongodb.net/');

const bcrypt = require('bcrypt');
const saltRounds = 5;

const session = require('express-session');
const mongoStore = require('connect-mongodb-session')(session);
server.use(session({
    secret: 'a secret fruit',
    saveUninitialized: true, 
    resave: false,
    store: new mongoStore({ 
      uri: 'mongodb+srv://andreiviguilla:test123@ccapdev.ka765zq.mongodb.net/',
      collection: 'mySession',
      expires: 1000*60*60 // 1 hour
    })
}));

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
  has_resto: {type: Boolean, default: false },
  bio: { type: String, default: 'No Bio Yet' }
}, { versionKey: false });

const restaurantsSchema = new mongoose.Schema({
    name: { type: String },
    description: { type: String },
    address: { type: String },
    logo: { type: String },
    reviews: [{
        rating: { type: Number },
        text: { type: String },
        reviewer: {type: String},
        reviewer_username: {type: String}
    }], 
    owner: { type: String }
}, { versionKey: false });

const accountModel = mongoose.model('account', accountsSchema);
const restaurantModel = mongoose.model('restaurant', restaurantsSchema);

const reviewsSchema = new mongoose.Schema({
    restaurant_id: { type: String },
    reviewer_id: { type: String }, // user id
    rating: { type: Number },
    likes: { type: Array}, // array of user ids
    dislikes: { type: Array}, // array of user ids
    review: { type: String },
}, { versionKey: false });

const reviewsCommentsSchema = new mongoose.Schema({
    review_id: { type: String },
    commenter_id: { type: String }, // user id
    comment: { type: String },
}, { versionKey: false });

const reviewsModel = mongoose.model('reviews', reviewsSchema);
const reviewsCommentsModel = mongoose.model('reviews_comments', reviewsCommentsSchema);

/*
    modus
    edit review on resturant:
        - check if current user owns review (match reviewer id with session user id)
        - if match; display edit button
        - when edit button is pressed, show interface
        - when 'save' button is pressed, perform update operation on the reviews:review

    marking helpful/unhelpful
        - buttons will act as a switch
        - +1 to h or uh if current user is not on either likes or dislikes, then button will switch to -1 to h or uh if pressed
        - cannot like and dislike at same time (check both arrays)

    comments on reviews
        - press dropdown on review to show comments
        - add comment using textboxt (add to review_comments)
        - 
*/

//EDITED--------------------------------------------------------------------------------------
// let logged_in = false;
// let currentUser = null;

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
        // Create an array to store structured ratings and reviews

        restaurantModel.find({}).then(function (restaurants) {
            for (const item of restaurants) {
                let sumRating = 0;
                for (let i = 0; i < item.reviews.length; i++) {
                    sumRating += item.reviews[i].rating;
                }
                let averageRating = sumRating / item.reviews.length;
                averageRating = parseFloat(averageRating.toFixed(1));

                resto_list.push({
                    _id: item._id.toString(),
                    name: item.name,
                    description: item.description,
                    avgRating: averageRating,
                    address: item.address,
                    logo: item.logo,
                    reviews: item.reviews,
                    numOfReviews: item.reviews.length
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

async function listUserRestaurants(username) {
    return new Promise((resolve, reject) => {
        const resto_list = [];

        // Check if a username is provided, if not, fetch all restaurants
        const query = username ? { owner: username } : {};

        restaurantModel.find(query).then(function (restaurants) {
            for (const item of restaurants) {
                let sumRating = 0;
                for (let i = 0; i < item.reviews.length; i++) {
                    sumRating += item.reviews[i].rating;
                }
                let averageRating = sumRating / item.reviews.length;
                averageRating = parseFloat(averageRating.toFixed(1));

                resto_list.push({
                    _id: item._id.toString(),
                    name: item.name,
                    description: item.description,
                    avgRating: averageRating,
                    address: item.address,
                    logo: item.logo,
                    reviews: item.reviews,
                    numOfReviews: item.reviews.length,
                    owner: item.owner
                });
            }

            // Sort the list by ascending name (default selection)
            resto_list.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

            resolve(resto_list);
        }).catch(reject); // Use reject for promise rejection
    });
}


server.get('/', function(req, resp) {
    listRestaurants().then(resto_list => {
        resp.render('main', {
            layout: 'index',
            title: 'Homepage | SulEAT Food Bites',
            css: 'main',
            restaurant_list: resto_list,
            logged_in: !!req.session.user
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
            logged_in: !!req.session.user
        });
    }).catch(errorFn);
});

server.post('/gotoAboutUs', function(req, resp) {
    resp.render('about_us', {
        layout: 'index',
        title: 'About Us',
        css: 'about_us',
        logged_in: !!req.session.user
    });
});

/////////////////////////////////////////////////////////////////////////////
server.post('/gotoUserRestaurant', function(req, resp) {
    resp.render('users_restaurant', {
        layout: 'index',
        title: 'User Restaurant',
        css: 'user_restaurant',
        logged_in: !!req.session.user
    });
});

server.get('/gotoUserRestaurant', async function(req, resp) {
    if (!req.session.user) {
        // If not logged in or currentUser is not set, redirect to login
        return resp.redirect('/login');
    }

    try {
        const username = req.session.user.username; // Assuming currentUser has a username property
        const userRestaurants = await listUserRestaurants(username);

        resp.render('users_restaurant', { // Assuming you have a template for this
            layout: 'index',
            title: 'My Restaurants',
            css: 'user_restaurant',
            logged_in: !!req.session.user,
            restaurant_list: userRestaurants
        });
    } catch (error) {
        console.error('Error fetching user restaurants:', error);
        resp.status(500).send('Internal server error');
    }
});

/////////////////////////////////////////////////////////////////////////////
server.post('/gotoRestaurants', function(req, resp) {
    listRestaurants().then(resto_list => {
        resp.render('restaurants', {
            layout: 'index',
            title: 'Restaurants',
            restaurant_list: resto_list,
            css: 'restaurants',
            logged_in: !!req.session.user
        });
    }).catch(errorFn);
});

server.post('/decideRestaurantDirection', async function(req, resp) {
    if (!req.session.user) {
        return resp.redirect('/login');
    }

    try {
        const user = await accountModel.findOne({ user: req.session.user.username }).exec();
        if (!!req.session.user && req.session.user.has_resto) {
            resp.redirect('/gotoUserRestaurant');
        } else {
            resp.redirect('/gotoRestaurantRegistration');
        }
    } catch (err) {
        console.error('Error retrieving user:', err);
        resp.status(500).send('Internal server error');
    }
});

server.post('/gotoReviews', function(req, resp) {
    listRestaurants().then(resto_list => {
        const restaurantName = req.body.restaurantName;
        const matchedRestaurant = resto_list.find(restaurant => restaurant.name === restaurantName);
        const reviews = [];

        for (let i = 0; i < matchedRestaurant.reviews.length; i++) {
            reviews.push({
                rating: matchedRestaurant.reviews[i].rating,
                text: matchedRestaurant.reviews[i].text,
                reviewer: matchedRestaurant.reviews[i].reviewer,
                editable: (matchedRestaurant.reviews[i].reviewer_username === req.session.user.username)
            });
            let editable = (matchedRestaurant.reviews[i].reviewer_username === req.session.user.username);
            // console.log(matchedRestaurant.reviews[i].reviewer_username + " = " + req.session.user.username);
            // console.log(editable);
        }

        resp.render('restaurant_page', {
            layout: 'index',
            title: 'Restaurant Reviews',
            matchedRestaurant: matchedRestaurant,
            css: 'restaurant_page',
            logged_in: !!req.session.user,
            reviews: reviews
        });
    }).catch(errorFn);
});


server.post('/gotoProfileFromResto', function(req, resp){

    resp.render('user_profile', {
        layout: 'index',
        title: 'Profile | SulEAT Food Bites',
        css: 'profile',
        logged_in: !!req.session.user,
        user_fname: req.session.user.fname,
        user_lname: req.session.user.lname,
        username: req.session.user.username,
        bio: req.session.user.bio,
        has_resto: req.session.user.has_resto
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
            logged_in: !!req.session.user,
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

server.post('/gotoEditAccount', (req, res) => {
    if (!req.session.user) {
      res.redirect('/login');
    } else {
      res.render('edit_account', {
        layout: 'index',
        title: 'Edit Account | SulEAT Food Bites',
        css: 'user_settings',
        fname: req.session.user.fname,
        lname: req.session.user.lname,
        password: req.session.user.pass,
        username: req.session.user.username,
        email: req.session.user.email,
        bio: req.session.user.bio,
        profilePicture: req.session.user.profilePicture
      });
    }
});

server.post('/updateAccount', async function(req, resp) {
    const accountQuery = { fname: req.session.user.fname, lname: req.session.user.lname }
    const password1 = req.body.password;
    const password2 = req.body.confirm_password;
    const old_pass = req.body.old_password;

    try {
        const account = await accountModel.findOne(accountQuery).exec();
        const isPasswordMatch = await bcrypt.compare(old_pass, account.pass);

        if (isPasswordMatch && password1 === password2) {
            const hashedPassword = await bcrypt.hash(password1, saltRounds);

            account.fname = req.body.firstname;
            account.lname = req.body.lastname;
            account.email = req.body.email;
            account.user = req.body.username;
            account.pass = hashedPassword; // Save the hashed password
            account.bio = req.body.bio;

            await account.save();

            resp.render('login', {
                layout: 'index',
                title: 'Account Login',
                css: 'login'
            });
        } else {
            resp.render('edit_account', {
                layout: 'index',
                title: 'Edit Account | SulEAT Food Bites',
                css: 'user_settings',
                errorMessage: 'Invalid inputs!',
            });
        }
    } catch (error) {
        console.error('Error updating account:', error);
        resp.status(500).send('Internal server error');
    }
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
    if (!req.session.user) {
        resp.redirect('/login');
    } 

    else{
        resp.render('restaurant_review', {
            layout: 'index',
            title: 'Review Restaurant',
            restaurantName: restaurantName,
            css: 'restaurant_review',
            logged_in: !!req.session.user
        });
    }

});

server.post('/submitReview', function(req, resp) {
    listRestaurants().then(resto_list => {
        const restaurantName = { name: req.body.restaurantName };
        const reviewerName = req.session.user.fname + " " + req.session.user.lname;
        const newRating = parseInt(req.body.ratingInput);
        const newText = req.body.reviewInput;
        console.log(reviewerName);

        // Find the restaurant by name and update it
        restaurantModel.findOne(restaurantName).then(function(restaurant) {
            // Push new review object to the reviews array
            restaurant.reviews.push({
                rating: newRating,
                text: newText,
                reviewer: reviewerName,
                reviewer_username: req.session.user.username
            });

            // Save the updated restaurant
            restaurant.save().then(function () {
                resp.render('main', {
                    layout: 'index',
                    title: 'Homepage | SulEAT Food Bites',
                    css: 'main',
                    restaurant_list: resto_list,
                    logged_in: !!req.session.user
                });
            }).catch(errorFn); // Catch save error

        }).catch(errorFn); // Catch find error
    }).catch(errorFn); // Catch listRestaurants error
});

server.post('/gotoProfile', function(req, resp) {
    resp.render('user_profile', {
        layout: 'index',
        title: 'Profile | SulEAT Food Bites',
        css: 'profile',
        logged_in: !!req.session.user,
        currentUser: req.session.user,
        has_resto: req.session.user.has_resto
    });
});

server.post('/gotoLogin', function(req, resp) {
    resp.render('login', {
        layout: 'index',
        title: 'Account Login',
        css: 'login'
    });
});

server.get('/login', function(req, resp) {
    resp.render('login', {
        layout: 'index',
        title: 'Account Login',
        css: 'login'
    });
});

server.post('/verifyLogin', async function(req, resp) {
    const { username, password } = req.body;

    try {
        const user = await accountModel.findOne({ user: username }).exec();
        if (user) {
            const isPasswordMatch = await bcrypt.compare(password, user.pass);
            if (isPasswordMatch) {
                // Store user information in session
                req.session.user = {
                    fname: user.fname,
                    lname: user.lname,
                    username: user.user,
                    bio: user.bio,
                    email: user.email,
                    has_resto: user.has_resto
                };
                console.log('Valid Login!');
                resp.redirect('/'); // Redirect to main page after login
            } else {
                console.log('Invalid Password!');
                resp.render('login', {
                    layout: 'index',
                    title: 'Account Login',
                    css: 'login',
                    error: 'Invalid password.'
                });
            }
        } else {
            console.log('Invalid Username!');
            resp.render('login', {
                layout: 'index',
                title: 'Account Login',
                css: 'login',
                error: 'Invalid username.'
            });
        }
    } catch (error) {
        console.error('Error during login:', error);
        resp.status(500).send('Internal server error');
    }
});

server.post('/gotoLogout', function(req, resp) {
    // Destroy the session and log the user out
    req.session.destroy(function(err) {
        if (err) {
            console.error('Error destroying session:', err);
        }
        resp.redirect('/');
    });
});

server.post('/gotoRestaurantRegistration', function(req, resp){
    resp.render('register_restaurant', {
        layout: 'index',
        title: 'Restaurant Registration',
        css: 'restaurant_forms'
    });
});
///
server.get('/gotoRestaurantRegistration', function(req, resp) {
    if (!req.session.user) {
        return resp.redirect('/login');
    }
    resp.render('register_restaurant', {
        layout: 'index',
        title: 'Register Your Restaurant',
        css: 'restaurant_forms',
        logged_in: !!req.session.user 
    });
});
///
server.post('/registerRestaurant', async function(req, resp) {
    // Make sure a user is logged in before allowing restaurant registration
    if (!req.session.user) {
        resp.redirect('/login');
        return;
    }
    
    const name = capitalize(req.body.res_name.trim());
    const combinedAddress = `${capitalize(req.body.res_street.trim())}, ${capitalize(req.body.res_city.trim())}, ${capitalize(req.body.res_province.trim())}`;

    try {
        const existingRestaurant = await restaurantModel.findOne({ name, address: combinedAddress });
        if (existingRestaurant) {
            // Handle the case where the restaurant already exists
            resp.render('register_restaurant', {
                layout: 'index',
                title: 'Restaurant Registration',
                css: 'restaurant_forms',
                error: 'A restaurant with this name and address already exists.'
            });
        } else {
            // Register the new restaurant with the current user as the owner
            const newRestaurant = new restaurantModel({
                name,
                description: req.body.res_description,
                rating: [],
                address: combinedAddress,
                logo: req.body.res_logo,
                owner: req.session.user.username // Assuming currentUser.user is the username
            });

            await newRestaurant.save();

            // Update the current user's has_resto field to true
            await accountModel.findOneAndUpdate(
              { user: req.session.user.username },
              { $set: { has_resto: true } }
            );

            // Handle successful registration
            resp.render('main', {
                layout: 'index',
                title: 'Home | SulEAT Food Bites',
                css: 'main',
                logged_in: !!req.session.user,
                message: "Successfully registered the restaurant!"
            });
        }
    } catch (error) {
        // Handle any errors during the process
        console.error('Registration error:', error);
        resp.status(500).render('register_restaurant', {
            layout: 'index',
            title: 'Error Registering Restaurant',
            css: 'restaurant_forms',
            error: 'An unexpected error occurred. Please try again.'
        });
    }
});


server.post('/createAccount', async function(req, resp) {
    const { username, password, email, firstname, lastname, 'confirm-password': confirmPassword, bio  } = req.body;
    const bioValue = 'No Bio Yet';

    try {
        // Check if password and confirm password match
        if (password === confirmPassword) {
            const existingUser = await accountModel.findOne({ user: username }).exec();
            if (existingUser) {
                console.log('Username already exists');
                return resp.render('register_account', {
                    layout: 'index',
                    title: 'Account Creation | SulEAT Food Bites',
                    css: 'user_registration',
                    error: 'Username already exists. Please choose another.'
                });
            } else {
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                const accountInstance = new accountModel({
                    user: username,
                    pass: hashedPassword,
                    email: email,
                    fname: firstname,
                    lname: lastname,
                    bio: bioValue,
                });

                // Save the user to the database
                await accountInstance.save();

                // Store user information in session
                req.session.user = {
                    fname: firstname,
                    lname: lastname,
                    username: username,
                    bio: bioValue,
                    email: email
                };

                resp.render('main', {
                    layout: 'index',
                    title: 'SulEAT Food Bites',
                    css: 'main',
                    logged_in: !!req.session.user // Check if user is logged in
                });
                console.log("Successfully registered!");
            }
        } else {
            console.log('Passwords do not match');
            resp.render('register_account', {
                layout: 'index',
                title: 'Account Creation | SulEAT Food Bites',
                css: 'user_registration',
                error: 'Passwords do not match. Please try again.'
            });
        }
    } catch (error) {
        console.error('Error creating account:', error);
        resp.status(500).send('Internal server error');
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
