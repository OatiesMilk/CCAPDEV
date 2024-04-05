$(document).ready(function() {
    $('#sort-by, #order-by').change(function() {
        const sortBy = $('#sort-by').val();
        const orderBy = $('#order-by').val();

        $.post('/sortRestaurants', { sortBy: sortBy, orderBy: orderBy }, function(response) {
            console.log(response);
            
            // Clears the existing restaurant list
            $('.restaurants-list').empty();
            
            // Loops through the sorted restaurant list and append each restaurant item to the list
            response.restaurant_list.forEach(function(restaurant) {
                var restaurantItem = `
                    <div class="restaurant-item">
                        <img class="restaurant-logo" src="${restaurant.logo}" alt="restaurant logo">
                        <div class="restaurant-info">
                            <h2>${restaurant.name}</h2>
                            <div class="restaurant-rating">
                                <meter value="${restaurant.rating}" min="0" max="5">${restaurant.rating}</meter>
                                <span>${restaurant.rating}</span>
                            </div>
                            <p class="restaurant-description">${restaurant.description}</p>
                        </div>
                        <form action="/gotoReviews" method="post">
                            <input type="hidden" name="restaurantName" value="${restaurant.name}">
                            <button type="submit" class="show-reviews-btn">Reviews ►</button>
                        </form>
                    </div>
                `;
                
                // Appends the restaurant item to the restaurant list
                $('.restaurants-list').append(restaurantItem);
            });
        });
    });

    $('#find').click(function(){
        $.post('/search',{ property: 'desc' },
        function(data, status){
            if(status === 'success'){
                console.log("test");
            }//if
    });//fn+post
    })

    /*$('#delete-review').click(function(){

        var indexValue = $(this).val()
        var restoName = $('#profile-name').val()

        $.post('/deleteReview', {indexVal: indexValue, restoName: restoName}),
        function(data, status){
            if(status === 'sucesss'){

            }
        }
    })*/
});



