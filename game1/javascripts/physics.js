const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 4; // Fixed grid size
const cols = canvas.width / gridSize;
const rows = canvas.height / gridSize;
const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
const gravity = 0.05; // Acceleration due to gravity (low value for gradual movement)
let isDrawing = false;

// Particle class
class SandParticle {
    constructor(x, y) {
        this.color = "#e2c044"; // Sand color
        const snapped = this.snapToGrid(x, y);
        this.gridX = snapped.gridX;
        this.gridY = snapped.gridY;
        this.velocityY = 0; // Initial vertical velocity
        this.fractionalY = 0; // Tracks sub-grid movement
    }

    snapToGrid(x, y) {
        return {
            gridX: Math.floor(x / gridSize),
            gridY: Math.floor(y / gridSize),
        };
    }

    // Update particle position
    update() {
        this.velocityY += gravity; // Apply gravity to velocity
        this.fractionalY += this.velocityY; // Accumulate fractional movement

        // Check if we have moved at least one full grid cell
        while (this.fractionalY >= 1) {
            const newGridY = this.gridY + 1;

            // Check if downward movement is blocked
            if (newGridY >= rows || grid[newGridY][this.gridX]) {
                // If downward movement is blocked, attempt diagonal movement

                let moved = false;

                // Try moving down-left (if it's within bounds and not occupied)
                if (this.gridX > 0 && this.gridY + 1 < rows && !grid[this.gridY + 1][this.gridX - 1]) {
                    this.moveTo(this.gridX - 1, this.gridY + 1); // Move down-left
                    moved = true;
                }
                
                // If down-left movement didn't happen, try moving down-right
                if (!moved && this.gridX < cols - 1 && this.gridY + 1 < rows && !grid[this.gridY + 1][this.gridX + 1]) {
                    this.moveTo(this.gridX + 1, this.gridY + 1); // Move down-right
                    moved = true;
                }

                // If both diagonal directions are blocked, stop the particle
                if (!moved) {
                    this.fractionalY = 0;
                    this.velocityY = 0;
                    return;
                }
            } else {
                // If downward movement is free, move the particle down
                this.moveTo(this.gridX, newGridY);
            }

            // Decrease fractionalY by 1, as the particle has moved one grid cell
            this.fractionalY -= 1;
        }
    }

    moveTo(newGridX, newGridY) {
        grid[this.gridY][this.gridX] = null; // Clear old position
        this.gridX = newGridX;
        this.gridY = newGridY;
        grid[this.gridY][this.gridX] = this; // Update grid with new position
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.gridX * gridSize,
            this.gridY * gridSize,
            gridSize,
            gridSize
        );
    }
}

// Event listeners for drawing
canvas.addEventListener("mousedown", (event) => {
    isDrawing = true;
    spawnParticle(event);
});
canvas.addEventListener("mousemove", (event) => {
    if (isDrawing) {
        spawnParticle(event);
    }
});
canvas.addEventListener("mouseup", () => {
    isDrawing = false;
});

// Spawn a new particle at mouse position
function spawnParticle(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const gridX = Math.floor(x / gridSize);
    const gridY = Math.floor(y / gridSize);

    // Only spawn if the cell is empty
    if (!grid[gridY][gridX]) {
        const particle = new SandParticle(x, y);
        grid[particle.gridY][particle.gridX] = particle;
    }
}

// Update all particles
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Loop through grid from bottom to top to handle falling correctly
    for (let row = rows - 1; row >= 0; row--) {
        for (let col = 0; col < cols; col++) {
            const particle = grid[row][col];
            if (particle) {
                particle.update();
                particle.draw();
            }
        }
    }

    requestAnimationFrame(update);
}

// Start the animation loop
update();
