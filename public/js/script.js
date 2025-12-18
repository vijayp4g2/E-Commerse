document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const productGrid = document.getElementById('product-grid');
    const cartCountElement = document.querySelector('.cart-count');
    const wishlistCountElements = document.querySelectorAll('.wishlist-count');
    const cartModalOverlay = document.querySelector('.cart-modal-overlay');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotalElement = document.querySelector('.cart-total-price');
    const closeCartBtn = document.querySelector('.close-cart');
    const cartBtn = document.querySelector('.cart-btn');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const productDetailContainer = document.getElementById('product-detail-container');
    const checkoutItemsContainer = document.getElementById('checkout-items');
    const checkoutTotalElement = document.getElementById('checkout-total');
    const checkoutForm = document.getElementById('checkout-form');
    const wishlistGrid = document.getElementById('wishlist-grid');
    const categoryGrid = document.getElementById('category-grid');

    // State
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    let allProducts = [];

    // Initialize
    updateCartCount();
    updateWishlistCount();
    setupEventListeners();
    startCountdown();
    initScrollAnimations();

    // Page Specific Logic
    const path = window.location.pathname;

    if (path.includes('product.html')) {
        loadProductDetails();
    } else if (path.includes('checkout.html')) {
        renderCheckout();
    } else if (path.includes('wishlist.html')) {
        // We need products to render wishlist, so fetch them first
        fetchProducts().then(() => renderWishlist());
    } else if (categoryGrid) {
        // Category Page
        const category = categoryGrid.dataset.category;
        fetchProducts().then(() => renderCategoryProducts(category));
    } else if (productGrid) {
        // Home page or pages with product grid
        fetchProducts();
    }

    // --- Data Fetching ---
    async function fetchProducts() {
        try {
            const response = await fetch('/api/products');
            const result = await response.json();
            if (result.message === 'success') {
                allProducts = result.data;
                window.products = allProducts; // Global fallback
                if (productGrid) renderProducts(allProducts);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }

    // --- Rendering ---
    function renderProducts(productsToRender) {
        if (!productGrid) return;
        productGrid.innerHTML = productsToRender.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <a href="product.html?id=${product.id}">
                        <img src="${product.image}" alt="${product.name}">
                    </a>
                    <button class="add-to-wishlist ${isInWishlist(product.id) ? 'active' : ''}" onclick="toggleWishlist(${product.id}, event)">
                        <i class="${isInWishlist(product.id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <span class="category">${product.category}</span>
                    <h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
                    <div class="rating">
                        ${getStarRating(product.rating)}
                        <span>(${product.rating})</span>
                    </div>
                    <div class="price-action">
                        <span class="price">$${product.price.toFixed(2)}</span>
                        <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                            <i class="fas fa-cart-plus"></i> Add
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderCategoryProducts(category) {
        if (!categoryGrid) return;
        const filteredProducts = allProducts.filter(p => p.category === category);

        if (filteredProducts.length === 0) {
            categoryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No products found in this category.</p>';
            return;
        }

        categoryGrid.innerHTML = filteredProducts.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <a href="product.html?id=${product.id}">
                        <img src="${product.image}" alt="${product.name}">
                    </a>
                    <button class="add-to-wishlist ${isInWishlist(product.id) ? 'active' : ''}" onclick="toggleWishlist(${product.id}, event)">
                        <i class="${isInWishlist(product.id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <span class="category">${product.category}</span>
                    <h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
                    <div class="rating">
                        ${getStarRating(product.rating)}
                        <span>(${product.rating})</span>
                    </div>
                    <div class="price-action">
                        <span class="price">$${product.price.toFixed(2)}</span>
                        <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                            <i class="fas fa-cart-plus"></i> Add
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async function loadProductDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId || !productDetailContainer) return;

        try {
            const response = await fetch(`/api/products/${productId}`);
            const result = await response.json();

            if (result.message === 'success') {
                const product = result.data;
                productDetailContainer.innerHTML = `
                    <div style="flex: 1; min-width: 300px;">
                        <img src="${product.image}" alt="${product.name}" style="width: 100%; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    </div>
                    <div style="flex: 1; min-width: 300px;">
                        <span style="color: var(--primary-color); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">${product.category}</span>
                        <h1 style="font-size: 2.5rem; margin: 0.5rem 0;">${product.name}</h1>
                        <div style="margin-bottom: 1.5rem; color: #ffc107;">${getStarRating(product.rating)} <span style="color: #666;">(${product.rating} Reviews)</span></div>
                        <h2 style="font-size: 2rem; color: var(--primary-color); margin-bottom: 1.5rem;">$${product.price.toFixed(2)}</h2>
                        <p style="font-size: 1.1rem; color: #666; margin-bottom: 2rem; line-height: 1.8;">${product.description}</p>
                        
                        <div style="display: flex; gap: 1rem;">
                            <button class="cta-btn primary" onclick="addToCart(${product.id})" style="border: none; cursor: pointer; padding: 1rem 3rem;">Add to Cart</button>
                            <button class="cta-btn white" onclick="toggleWishlist(${product.id})" style="border: 2px solid #eee;">
                                <i class="${isInWishlist(product.id) ? 'fas' : 'far'} fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            productDetailContainer.innerHTML = '<p>Product not found.</p>';
        }
    }

    function renderWishlist() {
        if (!wishlistGrid) return;

        if (wishlist.length === 0) {
            wishlistGrid.innerHTML = '<p>Your wishlist is empty.</p>';
            return;
        }

        // Filter allProducts to find matches in wishlist IDs
        const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));

        wishlistGrid.innerHTML = wishlistProducts.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <a href="product.html?id=${product.id}">
                        <img src="${product.image}" alt="${product.name}">
                    </a>
                    <button class="add-to-wishlist active" onclick="toggleWishlist(${product.id}, event)">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <div class="price-action">
                        <span class="price">$${product.price.toFixed(2)}</span>
                        <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Add</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderCheckout() {
        if (!checkoutItemsContainer) return;

        if (cart.length === 0) {
            checkoutItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            return;
        }

        checkoutItemsContainer.innerHTML = cart.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
                <div style="display: flex; gap: 1rem;">
                    <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                    <div>
                        <h4 style="margin: 0;">${item.name}</h4>
                        <small>Qty: ${item.quantity}</small>
                    </div>
                </div>
                <span style="font-weight: 600;">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (checkoutTotalElement) checkoutTotalElement.textContent = `$${total.toFixed(2)}`;
    }

    // --- Cart Logic ---
    window.addToCart = function (productId) {
        // If on product page, we might not have allProducts loaded yet if we came directly
        // But fetchProducts() is called on load if productGrid exists.
        // For product details, we fetched single product.

        let product = allProducts.find(p => p.id === productId);

        // Fallback for product detail page if allProducts isn't populated
        if (!product && window.location.pathname.includes('product.html')) {
            // We can try to grab it from the DOM or re-fetch, but for simplicity let's assume
            // we can fetch it or it's in the window.products fallback
            if (window.products) product = window.products.find(p => p.id === productId);
        }

        // If still not found (edge case), fetch it
        if (!product) {
            fetch(`/api/products/${productId}`).then(res => res.json()).then(res => {
                if (res.message === 'success') {
                    addItemToCart(res.data);
                }
            });
            return;
        }

        addItemToCart(product);
    };

    function addItemToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
        updateCartCount();
        renderCartItems();
        openCart();
        showToast(`${product.name} added to cart!`);
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountElement) cartCountElement.textContent = totalItems;
    }

    // --- Wishlist Logic ---
    window.toggleWishlist = function (productId, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const index = wishlist.indexOf(productId);
        if (index === -1) {
            wishlist.push(productId);
            showToast('Added to wishlist');
        } else {
            wishlist.splice(index, 1);
            showToast('Removed from wishlist');
        }

        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        updateWishlistCount();

        // Re-render if on wishlist page
        if (window.location.pathname.includes('wishlist.html')) {
            renderWishlist();
        } else {
            // Update icon state
            const btn = event ? event.currentTarget : document.querySelector(`.add-to-wishlist`);
            if (btn) {
                btn.classList.toggle('active');
                const icon = btn.querySelector('i');
                icon.classList.toggle('fas');
                icon.classList.toggle('far');
            }
        }
    };

    function isInWishlist(productId) {
        return wishlist.includes(productId);
    }

    function updateWishlistCount() {
        wishlistCountElements.forEach(el => el.textContent = wishlist.length);
    }

    // --- Checkout Logic ---
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simulate API call
            setTimeout(() => {
                cart = [];
                saveCart();
                alert('Order placed successfully! Thank you for shopping with us.');
                window.location.href = 'index.html';
            }, 1000);
        });
    }

    // --- Helper Functions ---
    function getStarRating(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        let starsHtml = '';
        for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
        if (halfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star"></i>';
        return starsHtml;
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // --- UI Interactions ---
    function setupEventListeners() {
        if (cartBtn) cartBtn.addEventListener('click', openCart);
        if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
        if (cartModalOverlay) {
            cartModalOverlay.addEventListener('click', (e) => {
                if (e.target === cartModalOverlay) closeCart();
            });
        }
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            });
        }

        // Promo banner close button
        const promoClose = document.querySelector('.promo-close');
        const promoBanner = document.querySelector('.promo-banner');
        if (promoClose && promoBanner) {
            promoClose.addEventListener('click', () => {
                promoBanner.style.transform = 'translateY(-100%)';
                setTimeout(() => {
                    promoBanner.style.display = 'none';
                }, 400);
            });
        }
    }

    function openCart() {
        renderCartItems();
        if (cartModalOverlay) {
            cartModalOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCart() {
        if (cartModalOverlay) {
            cartModalOverlay.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    function renderCartItems() {
        if (!cartItemsContainer) return;
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; margin-top: 2rem;">Your cart is empty.</p>';
            if (cartTotalElement) cartTotalElement.textContent = '$0.00';
            return;
        }
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                        <button class="remove-item" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (cartTotalElement) cartTotalElement.textContent = `$${total.toFixed(2)}`;
    }

    window.updateQuantity = function (productId, change) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) removeFromCart(productId);
            else {
                saveCart();
                updateCartCount();
                renderCartItems();
                if (window.location.pathname.includes('checkout.html')) renderCheckout();
            }
        }
    };

    window.removeFromCart = function (productId) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        updateCartCount();
        renderCartItems();
        if (window.location.pathname.includes('checkout.html')) renderCheckout();
    };

    function startCountdown() {
        const daysEl = document.getElementById('days');
        if (!daysEl) return;

        let deadline = new Date();
        deadline.setDate(deadline.getDate() + 2);

        function updateTimer() {
            const now = new Date().getTime();
            const distance = deadline - now;

            if (distance < 0) {
                deadline = new Date();
                deadline.setDate(deadline.getDate() + 2);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            if (document.getElementById('days')) document.getElementById('days').textContent = days < 10 ? '0' + days : days;
            if (document.getElementById('hours')) document.getElementById('hours').textContent = hours < 10 ? '0' + hours : hours;
            if (document.getElementById('minutes')) document.getElementById('minutes').textContent = minutes < 10 ? '0' + minutes : minutes;
            if (document.getElementById('seconds')) document.getElementById('seconds').textContent = seconds < 10 ? '0' + seconds : seconds;
        }

        setInterval(updateTimer, 1000);
        updateTimer();
    }

    // --- Scroll Animations ---
    function initScrollAnimations() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href.length > 1) {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });

        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Add scroll animation classes to elements
        const animateOnScroll = () => {
            // Animate section titles
            document.querySelectorAll('.section-title').forEach(el => {
                el.classList.add('scroll-animate');
                observer.observe(el);
            });

            // Animate feature items
            document.querySelectorAll('.feature-item').forEach((el, index) => {
                el.classList.add('scroll-animate', `stagger-${(index % 4) + 1}`);
                observer.observe(el);
            });

            // Animate category cards
            document.querySelectorAll('.category-card').forEach((el, index) => {
                el.classList.add('scroll-animate-scale', `stagger-${(index % 4) + 1}`);
                observer.observe(el);
            });

            // Animate product cards
            document.querySelectorAll('.product-card').forEach((el, index) => {
                el.classList.add('scroll-animate', `stagger-${(index % 4) + 1}`);
                observer.observe(el);
            });

            // Animate testimonial cards
            document.querySelectorAll('.testimonial-card').forEach((el, index) => {
                el.classList.add('scroll-animate-left', `stagger-${(index % 3) + 1}`);
                observer.observe(el);
            });

            // Animate deal section
            const dealContent = document.querySelector('.deal-content');
            const dealImage = document.querySelector('.deal-image');
            if (dealContent) {
                dealContent.classList.add('scroll-animate-left');
                observer.observe(dealContent);
            }
            if (dealImage) {
                dealImage.classList.add('scroll-animate-right');
                observer.observe(dealImage);
            }

            // Animate newsletter
            const newsletterContent = document.querySelector('.newsletter-content');
            if (newsletterContent) {
                newsletterContent.classList.add('scroll-animate-scale');
                observer.observe(newsletterContent);
            }

            // Animate footer content
            document.querySelectorAll('.footer-brand, .footer-links').forEach((el, index) => {
                el.classList.add('scroll-animate', `stagger-${(index % 4) + 1}`);
                observer.observe(el);
            });
        };

        // Initial animation setup
        animateOnScroll();

        // Re-observe when new products are loaded
        const originalRenderProducts = renderProducts;
        window.addEventListener('productsRendered', () => {
            setTimeout(() => {
                document.querySelectorAll('.product-card:not(.animate-in)').forEach((el, index) => {
                    el.classList.add('scroll-animate', `stagger-${(index % 4) + 1}`);
                    observer.observe(el);
                });
            }, 100);
        });

        // Parallax effect for hero section
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset;
                    const heroSlider = document.querySelector('.hero-slider');

                    if (heroSlider && scrolled < window.innerHeight) {
                        heroSlider.style.transform = `translateY(${scrolled * 0.5}px)`;
                    }

                    ticking = false;
                });
                ticking = true;
            }
        });
    }
});
