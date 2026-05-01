document.addEventListener('DOMContentLoaded', () => {
    // Sticky Navbar
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.add('scrolled'); // keep dark for visibility or configure threshold
            if(window.scrollY === 0) navbar.classList.remove('scrolled');
        }
    });

    // Checkout Modal Logic
    const buyButtons = document.querySelectorAll('.buy-btn');
    const checkoutModal = document.getElementById('checkoutModal');
    const closeModal = document.getElementById('closeModal');
    const planNameEl = document.getElementById('checkoutPlanName');
    const planPriceEl = document.getElementById('checkoutPlanPrice');
    
    // Also grab form elements early if needed
    const paymentForm = document.getElementById('paymentForm');

    let buttonDataPrice = 0;

    buyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const planName = button.getAttribute('data-plan');
            const planPrice = button.getAttribute('data-price');
            
            buttonDataPrice = planPrice;
            planNameEl.textContent = planName;
            planPriceEl.textContent = `Rs. ${parseInt(planPrice).toLocaleString()}`;
            
            checkoutModal.classList.add('active');
        });
    });

    closeModal.addEventListener('click', () => {
        checkoutModal.classList.remove('active');
    });

    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) {
            checkoutModal.classList.remove('active');
        }
    });

    // Payment Method Toggle
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    const cardDetails = document.getElementById('cardDetails');
    const bankDetails = document.getElementById('bankDetails');

    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'card') {
                cardDetails.classList.add('active');
                bankDetails.classList.remove('active');
            } else {
                bankDetails.classList.add('active');
                cardDetails.classList.remove('active');
            }
        });
    });

    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Change button state
        const submitBtn = paymentForm.querySelector('.pay-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing Visa Payment...';
        submitBtn.style.opacity = '0.7';
        submitBtn.disabled = true;

        const customerName = document.querySelector('input[placeholder="John Doe"]').value;
        const customerEmail = document.querySelector('input[type="email"]').value;
        const planName = planNameEl.textContent;
        const price = buttonDataPrice; // Assuming we assign this globally

        try {
            const response = await fetch('/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planName, price, customerName, customerEmail })
            });
            const data = await response.json();
            
            if (data.success) {
                window.location.href = data.url; // Redirect to success page
            } else {
                alert("Payment failed. Please check your card details.");
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error(error);
            alert("Payment error.");
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
});
