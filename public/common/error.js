function showError(message) {
    const errorBar = document.getElementById('errorBar');
    errorBar.textContent = message; // Set the error message
    errorBar.style.bottom = '0px'; // Slide up
    
    // Set timeout to slide down after 3 seconds
    setTimeout(() => {
        errorBar.style.bottom = '-50px'; // Slide back down
    }, 3000);
}
