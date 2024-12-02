// Select all navigation links
const navLinks = document.querySelectorAll('.navbar a');
const contentDiv = document.getElementById('content');

// Toggle navbar for mobile
function toggleNavbar() {
    const navbar = document.getElementById("myNavbar");
    if (navbar.className === "navbar") {
        navbar.className += " responsive";
    } else {
        navbar.className = "navbar";
    }
}

// Function to load HTML content dynamically
function loadContent(page) {
    fetch(page)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.text();
        })
        .then(html => {
            contentDiv.innerHTML = html; // Inject the fetched HTML
        })
        .catch(error => {
            console.error('Error fetching the page:', error);
            contentDiv.innerHTML = `<p>Sorry, the page could not be loaded.</p>`;
        });
}

// Add click event listeners to navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior    

        const page = link.dataset.page; // Get the data-page attribute
        loadContent(page); // Load the selected page content dynamically

        // Update the active class
        navLinks.forEach(link => link.classList.remove('active'));
        link.classList.add('active');
    });
});
loadContent('home.html');