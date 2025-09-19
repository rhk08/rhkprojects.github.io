// GLOBAL VARIABLES
let sectionCounter = 0;
let currentImageUrl = 'media/images/Bicycle/Bicycle (1).png';
let currentImageTitle = "bicycles";
let containerWidth = 294;
let containerHeight = 294;

// DOM Elements
let checkboxWindow = document.getElementById("recaptcha-checkbox-window");
let checkboxBtn = document.getElementById("checkbox");
let checkboxBtnSpinner = document.getElementById("spinner");
let verifyWindow = document.getElementById("recaptcha-verify-window");
let verifyBtn = document.getElementById("verify-button");


// CAPTCHA UI FUNCTIONS

function showCaptchaCheckbox() {
    checkboxBtn.style.borderRadius = "2px";
    checkboxBtn.style.opacity = "1";
    checkboxBtn.style.transform = "scale(1)";
    checkboxBtn.style.cursor = "pointer";
}

function hideCaptchaCheckbox() {
    checkboxBtn.style.borderRadius = "50%";
    checkboxBtn.style.opacity = "0";
    checkboxBtn.style.transform = "scale(0.2)";
    checkboxBtn.style.cursor = "default";
}

function showCaptchaLoading() {
    checkboxBtnSpinner.style.visibility = "visible";
    checkboxBtnSpinner.style.opacity = "1";
}

function hideCaptchaLoading() {
    checkboxBtnSpinner.style.opacity = "0";
    setTimeout(function(){
        checkboxBtnSpinner.style.visibility = "hidden";
    }, 400);
}

function showVerifyWindow() {
    verifyWindow.style.opacity = "1";
    verifyWindow.style.visibility = "visible";
    verifyWindow.style.pointerEvents = "auto";
    const container = document.getElementById('image-container');
    container.style.pointerEvents = 'auto';
}

function closeVerifyWindow() {
    verifyWindow.style.opacity = "0";
    verifyWindow.style.pointerEvents = "none";

    checkboxBtn.disabled = false;

    setTimeout(function(){
        hideCaptchaLoading();
        setTimeout(function(){
            showCaptchaCheckbox();
        }, 100);
        verifyWindow.style.visibility = "hidden";
    }, 400);
}


// CAPTCHA WORKFLOW FUNCTIONS

function runClickedCheckboxEffects() {
    hideCaptchaCheckbox();
    setTimeout(function(){
        showCaptchaLoading();
    }, 500);

    setTimeout(function(){
        showVerifyWindow();
    }, 900);
}

function verifyCaptcha() {
    fadeOutImageAndReset();
}

function fadeOutImageAndReset() {
    const container = document.getElementById('image-container');
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';

    setTimeout(() => {
        resetImage();
    }, 1300);
    setTimeout(() => {
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
    }, 1400);
}


// IMAGE UTILITY FUNCTIONS

function getContainerSize(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`No element found with id: ${containerId}`);
        return;
    }

    const rect = container.getBoundingClientRect();
    containerWidth = rect.width;
    containerHeight = rect.height;
}

async function randomiseImageAndTitle() {
    const res = await fetch("media/images/images.json");
    const images = await res.json();
    const random = images[Math.floor(Math.random() * images.length)];
    currentImageUrl = random.url;
    currentImageTitle = random.title;
}


// QUAD TREE SPLITTING FUNCTIONS

function createImageSection(x, y, width, height, parent = null) {
    const section = document.createElement('div');
    section.className = 'image-section';
    section.id = `section-${sectionCounter++}`;
    
    section.style.left = x + 'px';
    section.style.top = y + 'px';
    section.style.width = width + 'px';
    section.style.height = height + 'px';
    section.style.backgroundImage = `url('${currentImageUrl}')`;
    
    const bgX = -(x / containerWidth) * containerWidth;
    const bgY = -(y / containerHeight) * containerWidth;
    section.style.backgroundPosition = `${bgX}px ${bgY}px`;
    section.style.backgroundSize = `${containerWidth}px ${containerWidth}px`;

    section.style.opacity = '0';
    
    section.addEventListener('click', function(e) {
        e.stopPropagation();
        fadeOutAndSplit(this);
    });

    setTimeout(() => {
        section.style.transition = 'opacity 2s';
        section.style.opacity = '1';
    }, 100);
    
    return section;
}

function fadeOutAndSplit(section) {
    if (section.classList.contains('split') || section.classList.contains('fading')) {
        return;
    }
    
    section.classList.add('fading');
    section.style.transition = 'opacity 0.6s';
    section.style.opacity = '0';
    
    setTimeout(() => {
        splitSection(section);
    }, 650);
}

function splitSection(section) {
    if (section.classList.contains('split')) {
        return;
    }
    
    const x = parseFloat(section.style.left);
    const y = parseFloat(section.style.top);
    const width = parseFloat(section.style.width);
    const height = parseFloat(section.style.height);
    
    if (width < 2 || height < 2) {
        return;
    }
    
    section.classList.add('split');
    section.style.display = 'none';
    
    const newWidth = width / 2;
    const newHeight = height / 2;
    
    const quadrants = [
        { x: x, y: y },
        { x: x + newWidth, y: y },
        { x: x, y: y + newHeight },
        { x: x + newWidth, y: y + newHeight }
    ];
    
    const container = document.getElementById('image-container');
    
    quadrants.forEach(quad => {
        const newSection = createImageSection(quad.x, quad.y, newWidth, newHeight, section);
        container.appendChild(newSection);
    });
}

async function resetImage() {
    await randomiseImageAndTitle();

    const title = document.getElementById('verify-header-text-big');
    title.innerHTML = `${currentImageTitle}`;

    const container = document.getElementById('image-container');
    
    container.innerHTML = '';
    sectionCounter = 0;
    
    getContainerSize("image-container");

    const initialSection = createImageSection(0, 0, containerWidth, containerHeight);
    container.appendChild(initialSection);
}


// EVENT LISTENERS

function addCaptchaListeners() {
    if (checkboxBtn) {
        checkboxBtn.addEventListener("click", function (event) {
            event.preventDefault();
            checkboxBtn.disabled = true;
            runClickedCheckboxEffects();
        });

        verifyBtn.addEventListener("click", function (event) {
            event.preventDefault();
            verifyCaptcha();
        });
    }
}

document.addEventListener("click", function(event) {
    if (verifyWindow.style.visibility === "visible") {
        if (!verifyWindow.contains(event.target) && !checkboxBtn.contains(event.target)) {
            closeVerifyWindow();
            const container = document.getElementById('image-container');
            container.style.pointerEvents = 'none';

            setTimeout(() => {
                resetImage();
            }, 2000);
        }
    }
});


// INITIALIZATION

addCaptchaListeners();
resetImage();