const player = document.getElementById('arrow');
const gameArea = document.getElementById('gameArea');

const playerDeathSound = document.getElementById('playerDeathSound');
const enemyDeathSound = document.getElementById('enemyDeathSound');

const flavourText = document.getElementById('flavourText');

let angle;
let posX;
let posY;
let speed = 3.0;
const baseSpeed = 3.0;
const maxSpeed = 12;
const speedIncreaseRate = 0.016;
const speedDecreaseRate = 0.04;

let interval;
let rotationInterval;
let isTurning = false;
let turnSpeed = 1;
const maxTurnSpeed = 20; 
const turnIncreaseRate = 0.008;

let speedHighScore = 0;
let score = 0;
let finalScore = 0;

let isDead = false;
let isInvincible = true;

function getRandomPositionAndAngle() {
    const areaWidth = window.innerWidth;
    const areaHeight = window.innerHeight;

    posX = Math.random() * (areaWidth - 20);
    posY = Math.random() * (areaHeight - 20);
    angle = Math.random() * 360;

    player.style.left = `${posX}px`;
    player.style.top = `${posY}px`;
    player.style.transform = `rotate(${angle}deg)`;
}

function startMovement() {
    interval = setInterval(() => {
        posX += speed * Math.cos(angle * (Math.PI / 180));
        posY += speed * Math.sin(angle * (Math.PI / 180));

        player.style.left = `${posX}px`;
        player.style.top = `${posY}px`;

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
    }, 10);
}

function startTurning(direction) {
    if (isTurning) return;

    isTurning = true;
    turnSpeed = 1;
    const startTime = Date.now();

    rotationInterval = setInterval(() => {
        angle += direction * turnSpeed;
        player.style.transform = `rotate(${angle}deg)`;
        
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

        if (isDead) {
            clearInterval(interval); // Stop the interval when the player is dead
            return; // Exit the function
        }

        const speedFluctuation = Math.random() * 2 * a - a;
        const speedFluctuation2 = 1.5;

        let displayedSpeed = roundToOneDecimalPlace(40 + speedFluctuation2 * (speed - baseSpeed) + speedFluctuation);

        speedHighScore = Math.max(speedHighScore, displayedSpeed);

        document.getElementById('speedDisplay').innerText = `${displayedSpeed} km/h`;

        const newInterval = Math.max(10, 200 - displayedSpeed * 2);
        
        clearInterval(interval);
        interval = setInterval(updateSpeedDisplay, newInterval);
    };
    interval = setInterval(updateSpeedDisplay, 200);
}

const scoreDisplay = document.getElementById('scoreDisplay')

function incrementScore() {
    score += 1;
    scoreDisplay.innerText = `Score ${score}`

}

//Grid functions
// Create a grid object
let gridSize = 100; // Adjust grid size as needed
let grid = {}; // Stores arrows in different grid cells

// Function to get the grid cell for a given position
function getGridCell(x, y) {
    let cellX = Math.floor(x / gridSize);
    let cellY = Math.floor(y / gridSize);
    return `${cellX},${cellY}`;
}
// Function to add an arrow to the grid
function addToGrid(arrow) {
    let posX = parseFloat(arrow.style.left);
    let posY = parseFloat(arrow.style.top);
    let cell = getGridCell(posX, posY);
    
    if (!grid[cell]) {
        grid[cell] = [];
    }
    grid[cell].push(arrow);
}
// Function to remove an arrow from the grid
function removeFromGrid(arrow) {
    let posX = parseFloat(arrow.style.left);
    let posY = parseFloat(arrow.style.top);
    let cell = getGridCell(posX, posY);
    
    if (grid[cell]) {
        grid[cell] = grid[cell].filter(a => a !== arrow);
    }
}
// Function to update an arrow's position in the grid
function updateGridPosition(arrow) {
    removeFromGrid(arrow);
    addToGrid(arrow);
}
function getNearbyArrows(arrow) {
    let posX = parseFloat(arrow.style.left);
    let posY = parseFloat(arrow.style.top);
    let cell = getGridCell(posX, posY);
    let [cellX, cellY] = cell.split(',').map(Number);

    let nearbyArrows = [];
    
    // Check arrows in the current cell and neighboring cells
    for (let x = cellX - 1; x <= cellX + 1; x++) {
        for (let y = cellY - 1; y <= cellY + 1; y++) {
            let nearbyCell = `${x},${y}`;
            if (grid[nearbyCell]) {
                nearbyArrows.push(...grid[nearbyCell]);
            }
        }
    }
    return nearbyArrows;
}


//Enemy functions
let enemyBaseSpeed = 2.0;

let turningRate = 1.0;
let turningRateTowardsPlayer = 2.0; // Degrees to turn per interval
const turningThreshold = 30; 

let spawnInterval = 1000; // Spawn new arrows every 5 seconds
const spawnDistance = 200; //How many px away from another red arrow a div must be to spawn

const baseSpawnLimit = 6;
let spawnLimit = baseSpawnLimit;
let absoluteSpawnLimit = calculateAbsoluteSpawnLimit();
let spawnLimitReached = false;

let difficulty = 0;
let difficultyScaler = 0.0001;

//Create arrows
const visibleArrows = [];
const hiddenArrows = [];

// Preload arrows
for (let i = 0; i < spawnLimit; i++) {
    const arrow = document.createElement('div');
    arrow.className = 'red_arrow';
    arrow.style.display = 'none'; // Hide initially
    gameArea.appendChild(arrow);
    hiddenArrows.push(arrow);
}

function removeArrow(arrow) {
    arrow.style.display = 'none';
    
    const visibleIndex = visibleArrows.indexOf(arrow);
    if (visibleIndex !== -1) {
        visibleArrows.splice(visibleIndex, 1);  // Remove from visible arrows list
    }

    hiddenArrows.push(arrow);  // Return to hidden arrows pool
}

// Initial speed for each arrow
// Flag to track if speed increase is active

// Function to calculate the absolute spawn limit based on screen size
function calculateAbsoluteSpawnLimit() {
    const screenArea = window.innerWidth * window.innerHeight;
    console.log(Math.floor(screenArea / 40000));
    return Math.floor(screenArea / 40000);  // Adjust the divisor to control spawn density
}

let spawnLimitIncrementInterval;
function increaseSpawnLimit() {
    spawnLimitIncrementInterval = setInterval(() => {
        if (spawnLimit < absoluteSpawnLimit) {
            spawnLimit++;  // Increment spawn limit

            // Add new arrow to the pool
            const newArrow = document.createElement('div');
            newArrow.className = 'red_arrow';
            newArrow.style.display = 'none';  // Initially hidden
            gameArea.appendChild(newArrow);  // Add to the game area

            hiddenArrows.push(newArrow);  // Add to the hidden arrows pool

        } else {
            if (!spawnLimitReached) {
                displayTip({
                    newTip: 'Hard Mode Activated: Good Luck!',
                    buttonInnerText: 'Thanks.',
                    buttonColor: '#303030'
                });
                spawnLimitReached = true;
            }

            // If spawn limit exceeds absoluteSpawnLimit, remove hidden arrows
            if (spawnLimit > absoluteSpawnLimit) {
                // Remove hidden arrows until the spawn limit reaches the absolute limit
                while (spawnLimit > absoluteSpawnLimit && hiddenArrows.length > 0) {
                    const hiddenArrow = hiddenArrows.pop();  // Get the last hidden arrow
                    hiddenArrow.remove();  // Remove it from the DOM
                    spawnLimit--;  // Decrease spawn limit accordingly
                }
            }
        }
    }, 10000);  // Increase spawn limit every second
}

// Recalculate absolute spawn limit on window resize and current spawn limit
window.addEventListener('resize', () => {
    if(!isDead) {
        absoluteSpawnLimit = calculateAbsoluteSpawnLimit();

        //Disable Hard mode if enabled
        if(spawnLimitReached && spawnLimit < absoluteSpawnLimit){
            displayTip({
                newTip: 'Hard Mode De-Activated',
                buttonInnerText: '✖',
                buttonColor: '#303030'
            })
            spawnLimitReached = false;
        }else if(!spawnLimitReached && spawnLimit >= absoluteSpawnLimit){
            displayTip({
                newTip: 'Hard Mode Activated: Good Luck!',
                buttonInnerText: 'Thanks.',
                buttonColor: '#303030'
            })
            spawnLimitReached = true;
        }
    }
    console.log(absoluteSpawnLimit)

});

// Random rotation change in degrees when player is dead
const minAngleChange = -0.5; 
const maxAngleChange = 0.5;

let randomTargetPosX = Math.random() * window.innerWidth; // Initial random position
let randomTargetPosY = Math.random() * window.innerHeight; // Initial random position
// Function to generate a new random target position
function updateRandomTargetPosition() {
    randomTargetPosX = Math.random() * window.innerWidth;
    randomTargetPosY  = Math.random() * window.innerHeight;
}


function doEnemyMovement() {
    setInterval(() => {
        const obstacles = visibleArrows;       
        const playerPosX = parseFloat(player.style.left) + player.offsetWidth / 2; // Centered position of the player
        const playerPosY = parseFloat(player.style.top) + player.offsetHeight / 2;

        grid = {}; //Create new grid
        obstacles.forEach((arrow) => {
            // Add each arrow to the grid based on its position
            addToGrid(arrow);
        });

        //Check hardmode if not active reset difficulty
        if(!spawnLimitReached){
            difficulty = 0;
        }else{
            difficulty += difficultyScaler;
        }

        console.log('Visible Arrows:', visibleArrows);
        console.log('Hidden Arrows:', hiddenArrows);

        obstacles.forEach((arrow) => {
            let posX = parseFloat(arrow.style.left);
            let posY = parseFloat(arrow.style.top);
            let angle = parseFloat(arrow.style.transform.replace('rotate(', '').replace('deg)', '')) || Math.random() * 360;

            let speedIncreaseAmount = 0; // Amount by which speed will increase
            let speedIncreaseDuration = 0; // Duration for speed increase in milliseconds
            let speedIncreaseStartTime = 0; // Timestamp when the speed boost started
            let speedIncreaseActive = false; 

            let lastSpeedBoostTime = 0; // Timestamp for the last speed boost activation
            let cooldownDuration = 5000;

            let speed = enemyBaseSpeed; // Speed for each arrow

            // Avoidance behavior
            let isAvoiding = false; // Flag to check if the arrow is avoiding another arrow


            let nearbyArrows = getNearbyArrows(arrow);

            nearbyArrows.forEach((otherArrow) => {
                if (otherArrow !== arrow) { // Don't check against itself
                    const otherPosX = parseFloat(otherArrow.style.left);
                    const otherPosY = parseFloat(otherArrow.style.top);

                    const distance = Math.sqrt(Math.pow(otherPosX - posX, 2) + Math.pow(otherPosY - posY, 2));

                    // If too close, turn away
                    if (distance < turningThreshold) { // Adjust distance threshold as needed
                        const angleToOther = Math.atan2(otherPosY - posY, otherPosX - posX) * (180 / Math.PI);
                        
                        // Calculate the desired new angle (turn away)
                        let desiredAngle = (angleToOther + 180) % 360;

                        // Smoothly turn towards the desired angle
                        let angleDiff = desiredAngle - angle;
                        angleDiff = (angleDiff + 180) % 360 - 180; // Normalize to [-180, 180]

                        // Determine how much to turn based on the turning rate
                        if (Math.abs(angleDiff) < turningRate) {
                            angle = desiredAngle; // Snap to desired angle if within turning rate
                        } else {
                            angle += (angleDiff > 0 ? turningRate : -turningRate); // Turn by turning rate
                        }
                        isAvoiding = true; // Set avoiding flag
                    }
                }
            });

            // Only turn towards the player if not avoiding
            if (!isAvoiding) {
                let targetPosX, targetPosY;
                let speedMultiplier = 1;
            
                if (isDead) {
                    // Use the pre-generated random target position
                    targetPosX = randomTargetPosX;
                    targetPosY = randomTargetPosY;
                } else {
                    targetPosX = playerPosX;
                    targetPosY = playerPosY;
                    let distance = Math.sqrt(Math.pow(playerPosX - posX, 2) + Math.pow(playerPosY - posY, 2));
                    speedMultiplier = calculateSpeedBoostMultiplier(distance);
                }
            
                const angleToTarget = Math.atan2(targetPosY - posY, targetPosX - posX) * (180 / Math.PI);
            
                // Smoothly turn towards the target
                let angleDiff = angleToTarget - angle;
                angleDiff = (angleDiff + 180) % 360 - 180; // Normalize to [-180, 180]
            
                if (Math.abs(angleDiff) < turningRateTowardsPlayer) {
                    angle = angleToTarget; // Snap to desired angle if within turning rate
                } else {
                    angle += (angleDiff > 0 ? turningRateTowardsPlayer : -turningRateTowardsPlayer); // Turn by turning rate
                }

                if (spawnLimitReached) {
                    const currentTime = Date.now();

                    if (!speedIncreaseActive && (currentTime - lastSpeedBoostTime >= cooldownDuration)) {
                        // Generate random speed increase and duration
                        speedIncreaseAmount = Math.random() * (2*difficulty - difficulty) + difficulty; // Random speed increase between 1 and 5
                        speedIncreaseDuration = Math.floor(Math.random() * (5000 - 1000)) + 1000; // Random duration between 1s (1000 ms) and 5s (5000 ms)
                        speedIncreaseActive = true;
                        speed += speedIncreaseAmount * speedMultiplier; // Increase speed
                        speedIncreaseStartTime = Date.now(); // Record the time when boost started
                        lastSpeedBoostTime = currentTime; // Update the last speed boost time
                    }
                }
            }

            // Reset speed after duration
            if (speedIncreaseActive && (Date.now() - speedIncreaseStartTime >= speedIncreaseDuration)) {
                speedIncreaseAmount = 0; // Reset speed to original after duration
                speedIncreaseActive = false; // Mark boost as inactive
            }

            // console.log(speed)

            // Update position based on angle and speed
            posX += speed * Math.cos(angle * (Math.PI / 180));
            posY += speed * Math.sin(angle * (Math.PI / 180));

            // Wrap around the screen
            if (posX < 0) posX = window.innerWidth;
            if (posX > window.innerWidth) posX = 0;
            if (posY < 0) posY = window.innerHeight;
            if (posY > window.innerHeight) posY = 0;

            // Apply the updated position and angle
            arrow.style.left = `${posX}px`;
            arrow.style.top = `${posY}px`;
            arrow.style.transform = `rotate(${angle}deg)`; // Update rotation after angle adjustment

            // Update grid position after movement
            updateGridPosition(arrow);

            checkCollisions();
            checkPlayerCollision();
        });
    }, 10); // Update interval set to 5ms for smooth movement
}

function calculateSpeedBoostMultiplier(distance) {
    const baseMultiplier = 1; // Base multiplier for minimum distance
    const maxMultiplier = 3; // Maximum multiplier for farthest distance
    const maxDistance = 500; // The distance at which the maximum multiplier applies

    // Clamp the distance to avoid negative values
    const clampedDistance = Math.max(0, distance);

    // Calculate the multiplier based on distance
    const multiplier = baseMultiplier + (maxMultiplier - baseMultiplier) * (clampedDistance / maxDistance);

    // Ensure the multiplier does not exceed the maximum
    return Math.min(multiplier, maxMultiplier);
}

let spawnIntervalId;
function spawnArrow() {
    // Clear the previous interval if it exists
    if (spawnIntervalId) {
        clearInterval(spawnIntervalId);
    }

    // Create a new interval with the current spawnInterval value
    spawnIntervalId = setInterval(() => {
        if (visibleArrows.length < spawnLimit) {

            let newArrow = null;

            // Check if we have hidden arrows available in the pool
            if (hiddenArrows.length > 0) {
                newArrow = hiddenArrows.pop();  // Reuse a hidden arrow
                newArrow.style.display = 'block';  // Make it visible again
            }

            if (newArrow) {
                // Set random position within the bounds of the game area
                const randomX = Math.random() * (gameArea.clientWidth - 20);
                const randomY = Math.random() * (gameArea.clientHeight - 20);

                // Set position and rotation
                newArrow.style.left = `${randomX}px`;
                newArrow.style.top = `${randomY}px`;
                const randomAngle = Math.random() * 360;
                newArrow.style.transform = `rotate(${randomAngle}deg)`;

                // Get nearby arrows based on the new arrow's position
                const nearbyArrows = getNearbyArrows(newArrow);
                let isTooClose = false;

                // Check distance to nearby arrows
                nearbyArrows.forEach((arrow) => {
                    const otherPosX = parseFloat(arrow.style.left);
                    const otherPosY = parseFloat(arrow.style.top);
                    const distance = Math.sqrt(Math.pow(otherPosX - randomX, 2) + Math.pow(otherPosY - randomY, 2));

                    if (distance < spawnDistance) {
                        isTooClose = true;
                    }
                });

                // Check for proximity to the player (if needed)
                const playerPosX = parseFloat(player.style.left) + player.offsetWidth / 2;
                const playerPosY = parseFloat(player.style.top) + player.offsetHeight / 2;
                const distanceToPlayer = Math.sqrt(Math.pow(playerPosX - randomX, 2) + Math.pow(playerPosY - randomY, 2));

                if (distanceToPlayer < spawnDistance) {
                    isTooClose = true;
                }

                // Only keep the new arrow if no nearby arrows were found
                if (!isTooClose) {
                    visibleArrows.push(newArrow);  // Add to visible arrows list
                } else {
                    // Return arrow to hidden state if not used
                    newArrow.style.display = 'none';
                    hiddenArrows.push(newArrow);  // Return to hidden arrows pool
                }
            }
        } else {

        }
    }, spawnInterval);
}
function updateSpawnInterval(newInterval) {
    spawnInterval = newInterval;
    spawnArrow(); // Restart spawning with the new interval
}

//How much you want to reduce collision boxes by
const scaleFactor = 0.2;
const playerScaleFactor = 0.3; 

function checkCollisions() {
    const obstacles = visibleArrows; 
    const arrowsToDestroy = new Set(); // Use a Set to avoid duplicate entries

    obstacles.forEach((arrowA) => {
        const rectA = arrowA.getBoundingClientRect();

        const smallerRectA = {
            left: rectA.left + rectA.width * scaleFactor,  // Adjust left position
            right: rectA.right - rectA.width * scaleFactor, // Adjust right position
            top: rectA.top + rectA.height * scaleFactor,    // Adjust top position
            bottom: rectA.bottom - rectA.height * scaleFactor // Adjust bottom position
        };

        // Get nearby arrows using the grid
        const nearbyArrows = getNearbyArrows(arrowA);

        nearbyArrows.forEach((arrowB) => {
            if (arrowA !== arrowB) { // Ensure not checking against itself
                const rectB = arrowB.getBoundingClientRect();

                // Create smaller bounding box for arrowB using scaleFactor
                const smallerRectB = {
                    left: rectB.left + rectB.width * scaleFactor,
                    right: rectB.right - rectB.width * scaleFactor,
                    top: rectB.top + rectB.height * scaleFactor,
                    bottom: rectB.bottom - rectB.height * scaleFactor
                };

                // Check for collision using the smaller bounding box
                if (
                    smallerRectA.left < smallerRectB.right &&
                    smallerRectA.right > smallerRectB.left &&
                    smallerRectA.top < smallerRectB.bottom &&
                    smallerRectA.bottom > smallerRectB.top
                ) {
                    // Collision detected, mark arrows for destruction
                    arrowsToDestroy.add(arrowA);
                    arrowsToDestroy.add(arrowB);
                }
            }
        });
    });

    // Destroy the colliding arrows
    if (arrowsToDestroy.size > 0) {
        triggerShakeAnimation2();
        enemyDeathSound.currentTime = 0;
        enemyDeathSound.volume = 0.3; // Reset the sound to start
        enemyDeathSound.play();
    }
    arrowsToDestroy.forEach((arrow) => {
        removeArrow(arrow);
        if (!isDead) {
            incrementScore();
        }
    });
}
function checkPlayerCollision() {
    // Get player's bounding rect and adjust with scaleFactor
    const rectA = player.getBoundingClientRect();
    const smallerRectA = {
        left: rectA.left + rectA.width * playerScaleFactor,
        right: rectA.right - rectA.width * playerScaleFactor,
        top: rectA.top + rectA.height * playerScaleFactor,
        bottom: rectA.bottom - rectA.height * playerScaleFactor
    };

    // Flag to determine if player has died
    let playerDied = false;
    const arrowsDestroyedByPlayer = new Set();

    //Get nearby arrows
    const nearbyArrows = getNearbyArrows(player);

    // Loop through all obstacles
    nearbyArrows.forEach((arrowB) => {
        // Get bounding rect of the current arrow and adjust with scaleFactor
        const rectB = arrowB.getBoundingClientRect();
        const smallerRectB = {
            left: rectB.left + rectB.width * playerScaleFactor,
            right: rectB.right - rectB.width * playerScaleFactor,
            top: rectB.top + rectB.height * playerScaleFactor,
            bottom: rectB.bottom - rectB.height * playerScaleFactor
        };

        // Check for collision between player and the current arrow
        if (
            smallerRectA.left < smallerRectB.right &&
            smallerRectA.right > smallerRectB.left &&
            smallerRectA.top < smallerRectB.bottom &&
            smallerRectA.bottom > smallerRectB.top
        ) {
            arrowsDestroyedByPlayer.add(arrowB);
            if(!isInvincible){
                playerDied = true; // Set playerDied to true if a collision is detected
            }
        }
    });

    // Remove collided arrows and update score
    if (arrowsDestroyedByPlayer.size > 0 && isInvincible) {
        triggerShakeAnimation2();
        enemyDeathSound.currentTime = 0;
        
        let calculatedVolume = 0.4 * arrowsDestroyedByPlayer.size;

        // Cap the volume at 0.6
        if (calculatedVolume > 0.5) {
            calculatedVolume = 0.5;
        }
        enemyDeathSound.volume = calculatedVolume;
        enemyDeathSound.play();
    }
    arrowsDestroyedByPlayer.forEach((arrow) => {
        removeArrow(arrow); // Remove the arrow from the DOM
        if(!isDead) {
            incrementScore();
        }
    });
    // Call playerDeath only once if the player has died
    if (playerDied) {
        playerDeath();
    }
}

function playerDeath() {
    playerDeathSound.currentTime = 0;
    playerDeathSound.volume = 0.4; // Reset the sound to start
    playerDeathSound.play();

    player.remove();
    triggerShakeAnimation1();
    isDead = true;
    
    spawnLimit = 0;
    absoluteSpawnLimit = 0;
    // spawnLimitReached = false;

    clearInterval(spawnIntervalId); //Stop arrows from spawning
    clearInterval(spawnLimitIncrementInterval); //Stop spawn limit from increasing

    enemyBaseSpeed = 0.6;
    turningRate = 0.6;
    turningRateTowardsPlayer = 0.3;

    finalScore = score;

    const speedDisplay = document.getElementById('speedDisplay');
    
    speedDisplay.innerText = `Max Speed ${speedHighScore.toFixed(1)} km/h`;
    scoreDisplay.innerText = `Final Score ${finalScore}`;

    document.getElementById('flavourWrapper').innerHTML = `
        <h4 id="flavourText" style="font-size: 32px;">You Died.</h4>
    `;

    if (isDead) {
        displayTip({
            newTip: "You've just died, reload the page to try again!",
            buttonInnerText: 'Reload',
            onClickFunction: restartGame,
            buttonColor: '#303030',
            displayTime: 60000
        })
    }


    setInterval(() => {
        if (isDead) {
            updateRandomTargetPosition();
        }
    }, 3000);

}

function restartGame() {
    location.reload(); // Simple reload to restart the game, or you can add more logic for resetting game variables
}

function triggerShakeAnimation0() {
    const messageBox = document.getElementById('message_box0');
    if (messageBox) {
        messageBox.classList.add('tilt-shaking');

        // Remove the shake class after the animation ends
        setTimeout(() => {
            messageBox.classList.remove('tilt-shaking');
        }, 150); // Match the duration of the shake animation (0.3s)
    }
}
function triggerShakeAnimation1() {
    document.body.classList.add('vertical-shaking');

    // Remove the shake class after the animation ends
    setTimeout(() => {
        document.body.classList.remove('vertical-shaking');
    }, 150); // Match the duration of the shake animation (0.3s)
}
function triggerShakeAnimation2() {
    document.body.classList.add('slight-vertical-shaking');

    // Remove the shake class after the animation ends
    setTimeout(() => {
        document.body.classList.remove('slight-vertical-shaking');
    }, 150); // Match the duration of the shake animation (0.3s)
}


function changeMode() {
    if(!isDead) {
        isInvincible = !isInvincible;
        checkMode();
    }else{
        displayTip({
            newTip: "Tip: You're dead already (Reload to restart)",
            displayTime: 3000,
            buttonInnerText: 'Understood.',
            buttonColor: '#303030',
        });
    }
}

let initialEndlessModeTimer;
function checkMode(){
    const mode = document.getElementById('modeChange');
    if (isInvincible) {
        mode.innerText = `Endless Mode`;
        mode.classList.add('endless');
        mode.classList.remove('survival');

        if(gameBegin){
            updateSpawnInterval(300);
        }else{
            updateSpawnInterval(1000);
            initialEndlessModeTimer = setTimeout(() => {
                updateSpawnInterval(300); // Start the game if not started already
            }, 15000);
        }

        score = 0;
        scoreDisplay.innerText = `Score 0`;
        if(spawnLimitReached){
            displayTip({
                newTip: 'Hard Mode De-Activated',
                buttonInnerText: '✖',
                buttonColor: '#303030'
            })
            spawnLimitReached = false;
        }
        spawnLimit = baseSpawnLimit;

        if(gameBegin){
            displayTip({
                newTip: 'Endless Mode Activated: You can Relax Now.',
                buttonInnerText: 'Got it!',
                buttonColor: '#2196F3'
            })

            if(visibleArrows.length > 0){
                playerDeathSound.currentTime = 0;
                playerDeathSound.volume = 0.4;
                playerDeathSound.play();
                triggerShakeAnimation1()

                for (let i = visibleArrows.length - 1; i >= 0; i--) {
                    removeArrow(visibleArrows[i]); // Call removeArrow for each arrow
                }
            }

        }

    } else {
        mode.innerText = `Survival Mode`;
        mode.classList.add('survival');
        mode.classList.remove('endless');
        updateSpawnInterval(1000);
        score = 0;
        scoreDisplay.innerText = `Score 0`;
        spawnLimit = baseSpawnLimit;
        speed = 0;
        speedHighScore = 0;
        if(spawnLimitReached){
            displayTip({
                newTip: 'Hard Mode De-Activated',
                buttonInnerText: '✖',
                buttonColor: '#303030'
            })
            spawnLimitReached = false;
        }
        if(gameBegin){
            displayTip({
                newTip: 'Survival Mode Activated: Watch Out!',
                buttonInnerText: 'Got it.',
                buttonColor: '#d23838'
            })
            
            if(visibleArrows.length > 0){
                playerDeathSound.currentTime = 0;
                playerDeathSound.volume = 0.4;
                playerDeathSound.play();
                triggerShakeAnimation1()

                for (let i = visibleArrows.length - 1; i >= 0; i--) {
                    removeArrow(visibleArrows[i]); // Call removeArrow for each arrow
                }
            }
        }
    }
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

let gameBegin = false;

window.onload = () => {
    getRandomPositionAndAngle();
    startMovement();
    displaySpeed();
    doEnemyMovement();
    
    updateRandomTargetPosition();

    setTimeout(() => {
        displayTip({
            newTip: "Tip: Hold the Left or Right mouse buttons to turn and speed up!",
            buttonInnerText: 'Begin',
            buttonColor: '#4cb94e',  // Optional: style the button
            onClickFunction: closeTipAndStartGame, // Trigger game start when closed
            displayTime: 14500 // Tip will still automatically disappear if not closed manually
        });
    
        // Start the game after 10 seconds
        gameStartTimeout = setTimeout(() => {
            startGame();
            showModeChangeButton(); // Start the game if not started already
        }, 14500); // 10 seconds
    }, 500); // 1s delay for smooth appearance
};

let gameStartTimeout; // Variable to store the timeout ID

function startGame() {
    checkMode();
    gameBegin = true;
    spawnArrow();
    increaseSpawnLimit();

}

function closeTipAndStartGame(button) {
    closeTip(button); // Close the tip as usual
    startGame();      // Start the game immediately after closing the tip
    clearTimeout(gameStartTimeout);
    showModeChangeButton(); // Clear the timeout if the tip is closed early
}

function showModeChangeButton() {
    const mode = document.getElementById('modeChange');
    mode.classList.remove('hidden');
    mode.classList.add('fadeInDrop');
}

function closeTip(button) {
    const tipElement = button.parentElement; // Get the tip element
    tipElement.classList.remove('show'); // Hide the tip
    setTimeout(() => {
        tipElement.remove(); // Remove the tip element after hiding
    }, 300); // Match with CSS transition duration
}

function displayTip(
    { 
        newTip = "Tip: Hold the Left or Right mouse buttons to turn and speed up!", 
        buttonInnerText = 'Got it!', 
        buttonColor = '#4cb94e', 
        onClickFunction = closeTip, 
        displayTime = 3000 
    }
) {
    const tipContainer = document.getElementById('tipContainer');

    // Create a new tip element
    const tipElement = document.createElement('div');
    tipElement.className = 'tip';

    // Create and append the tip text
    const tipText = document.createElement('span');
    tipText.innerText = newTip;
    tipElement.appendChild(tipText);

    // Create and append the button
    const closeTipBtn = document.createElement('button');
    closeTipBtn.className = 'closeTipBtn'
    closeTipBtn.innerText = buttonInnerText;
    closeTipBtn.style.backgroundColor = buttonColor; // Change button color
    closeTipBtn.onclick = () => onClickFunction(closeTipBtn); // Set onclick to closeTip
    tipElement.appendChild(closeTipBtn);

    // Append the new tip to the container
    tipContainer.appendChild(tipElement);

    // Show the tip with animation
    setTimeout(() => {
        tipElement.classList.add('show');
    }, 10); // A slight delay for the CSS transition

    // Optional: Automatically hide the tip after a certain time
    setTimeout(() => {
        closeTip(closeTipBtn); // Automatically close the tip
    }, displayTime); // Adjust the time as needed (e.g., 5000 ms = 5 seconds)
}