$(document).ready(function() {
    $("#find").click(function() {
        sortRestaurants();
    });

    $("#sort-by, #order-by").change(function() {
        sortRestaurants();
    });

    function sortRestaurants() {
        const sortBy = $("#sort-by").val();
        const orderBy = $("#order-by").val();

        resto_list.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
    
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
    
            if (orderBy === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });

        $.post('ajax_response', { sortBy: sortBy, orderBy: orderBy }, function(data, status) {
            if (status === 'success') {
                resto_list = data;
                updateRestaurantListUI();
            }
        });
    }

    function updateRestaurantListUI() {
        //todo
    }
});