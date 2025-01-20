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




// // Call the function to fill the cube
// fillCubeWithSmallCubes();
