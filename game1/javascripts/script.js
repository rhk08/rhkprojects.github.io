const cube = document.getElementById("cube");
let isDragging = false;
let startX, startY;
let rotateX = 0;
let rotateY = 0;

document.querySelector(".scene").addEventListener("mousedown", (event) => {
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    document.body.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (event) => {
    if (!isDragging) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    rotateY += deltaX * 0.5; // Adjust the speed of rotation
    rotateX -= deltaY * 0.5;

    cube.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

    startX = event.clientX;
    startY = event.clientY;
});

document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.cursor = "grab";
});

function fillCubeWithSmallCubes() {
    const gridSize = 4; // 4x4x4 grid of small cubes
    const smallCubeSize = 50; // Each small cube is 50px by 50px

    // Loop through the grid and generate smaller cubes at each coordinate
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
                const smallCube = document.createElement("div");
                smallCube.classList.add("small-cube");

                // Position each small cube based on the 3D grid
                smallCube.style.transform = `translate3d(${x * smallCubeSize - (gridSize * smallCubeSize) / 2}px, 
                ${y * smallCubeSize - (gridSize * smallCubeSize) / 2}px, 
                ${z * smallCubeSize - (gridSize * smallCubeSize) / 2}px)`;

                // Add faces to the smaller cube
                ["front", "back", "right", "left", "top", "bottom"].forEach(face => {
                    const faceDiv = document.createElement("div");
                    faceDiv.classList.add("face", face);
                    faceDiv.textContent = `${x},${y},${z}`; // Show coordinates for debugging
                    smallCube.appendChild(faceDiv);
                });

                // Append the small cube to the larger cube
                cube.appendChild(smallCube);
            }
        }
    }
}


// // Call the function to fill the cube
// fillCubeWithSmallCubes();
