const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });
}

const welcomeBtn = document.getElementById('welcomeBtn');
const tipMessage = document.getElementById('tipMessage');

if (welcomeBtn && tipMessage) {
  welcomeBtn.addEventListener('click', () => {
    tipMessage.classList.toggle('show');
  });
}

const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    let isValid = true;

    const nameField = document.getElementById('name');
    const emailField = document.getElementById('email');
    const messageField = document.getElementById('message');

    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const messageError = document.getElementById('messageError');
    const formSuccess = document.getElementById('formSuccess');

    nameError.textContent = '';
    emailError.textContent = '';
    messageError.textContent = '';
    formSuccess.classList.remove('show');

    if (nameField.value.trim() === '') {
      nameError.textContent = 'Please enter your name.';
      isValid = false;
    }

    const emailValue = emailField.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailValue === '') {
      emailError.textContent = 'Please enter your email.';
      isValid = false;
    } else if (!emailPattern.test(emailValue)) {
      emailError.textContent = 'Please enter a valid email address.';
      isValid = false;
    }

    if (messageField.value.trim() === '') {
      messageError.textContent = 'Please enter a message.';
      isValid = false;
    }

    if (isValid) {
      formSuccess.classList.add('show');
      contactForm.reset();
    }
  });
}