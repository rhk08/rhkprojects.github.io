const arrow = document.getElementById('arrow');
const gameArea = document.getElementById('gameArea');

let angle;
let posX;
let posY;
let speed = 1.5;
const baseSpeed = 1.5;
const maxSpeed = 6;
const speedIncreaseRate = 0.008;
const speedDecreaseRate = 0.02;

let interval;
let rotationInterval;
let isTurning = false;
let turnSpeed = 1;
const maxTurnSpeed = 20; 
const turnIncreaseRate = 0.004;

function getRandomPositionAndAngle() {
    const areaWidth = window.innerWidth;
    const areaHeight = window.innerHeight;

    posX = Math.random() * (areaWidth - 50);
    posY = Math.random() * (areaHeight - 50);
    angle = Math.random() * 360;

    arrow.style.left = `${posX}px`;
    arrow.style.top = `${posY}px`;
    arrow.style.transform = `rotate(${angle}deg)`;
}

function startMovement() {
    interval = setInterval(() => {
        posX += speed * Math.cos(angle * (Math.PI / 180));
        posY += speed * Math.sin(angle * (Math.PI / 180));

        arrow.style.left = `${posX}px`;
        arrow.style.top = `${posY}px`;

        if (posX < 0) posX = window.innerWidth;
        if (posX > window.innerWidth) posX = 0;
        if (posY < 0) posY = window.innerHeight;
        if (posY > window.innerHeight) posY = 0;

        if(speed > baseSpeed && isTurning == false){
            speed -= speedDecreaseRate;
        }

        if(speed <= baseSpeed){
            speed = baseSpeed;
        }
    }, 5);
}

function startTurning(direction) {
    if (isTurning) return;

    isTurning = true;
    turnSpeed = 1;
    const startTime = Date.now();

    rotationInterval = setInterval(() => {
        angle += direction * turnSpeed;
        arrow.style.transform = `rotate(${angle}deg)`;
        
        if (turnSpeed < maxTurnSpeed) {
            turnSpeed *= 1+turnIncreaseRate;
        }
        if (Date.now() - startTime < 3000) {
            speed += speedIncreaseRate;
        }
    }, 5);
}

function stopTurning() {
    clearInterval(rotationInterval);
    isTurning = false;
}

function roundToOneDecimalPlace(num) {
    return Math.round(num * 10) / 10;
}

function displaySpeed() {
    const a = 0.2;
    let interval;

    const updateSpeedDisplay = () => {
        const speedFluctuation = Math.random() * 2 * a - a;
        const speedFluctuation2 = Math.random() + 3;

        const displayedSpeed = roundToOneDecimalPlace(40 + speedFluctuation2 * (speed - baseSpeed) + speedFluctuation);
        document.getElementById('speedDisplay').innerText = `${roundToOneDecimalPlace(displayedSpeed)} km/h`;

        const newInterval = Math.max(10, 200 - displayedSpeed * 2);
        
        clearInterval(interval);
        interval = setInterval(updateSpeedDisplay, newInterval);
    };

    interval = setInterval(updateSpeedDisplay, 200);
}

document.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
        startTurning(-1);
    } else if (event.button === 2) {
        startTurning(1);
    }
});

document.addEventListener('mouseup', stopTurning);

gameArea.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

window.onload = () => {
    getRandomPositionAndAngle();
    startMovement();
    displaySpeed();
};
