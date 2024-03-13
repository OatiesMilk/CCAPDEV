$(document).ready(function() {
    $('#sort-by, #order-by').change(function() {
        const sortBy = $('#sort-by').val();
        const orderBy = $('#order-by').val();

        $.post('sortRestaurants', { sortBy: sortBy, orderBy: orderBy }, function(response) {
            console.log(response);
            
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
});