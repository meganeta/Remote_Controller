let stop = document.getElementById('stop');

let FMspeed = 0;
let DGspeed = 0;

//emergency stop button
stop.onclick = function(){
    console.log("STOP");
    FMspeed = 0;
    DGspeed = 0;

    dotX = dotRadius;
    dotY = canvas.height-dotRadius;
    draw();
};

//update speed/strength
//This function will be implemented in the ws server
/*
function updatespeed() {
    socket.send(String(FMspeed));
}
*/

//Handle Charts
const FMchart = document.getElementById('FMchart');
const DGchart = document.getElementById('DGchart');

//Handle Canvas and plot
const canvas = document.getElementById('myCanvas');

const dotRadius = 10;
let dotX = dotRadius;
let dotY = canvas.height-dotRadius;
let isDragging = false;
let FMData = [100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,];
let DGData = [100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,];

let relativeHeight;
let relativeWidth;

//Canvas drawing
function draw(resize = false) {
    // Get wrapper dimensions
    const wrapperWidth = canvas.parentElement.offsetWidth;
    const wrapperHeight = canvas.parentElement.offsetHeight;

    // Set canvas dimensions
    canvas.width = wrapperWidth;
    canvas.height = wrapperHeight;

    if(resize){
        dotX = dotRadius;
        dotY = canvas.height-dotRadius;
    }

    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#AA336A';
    ctx.fill();
    ctx.closePath();
    
    //update dot location
    relativeHeight = (100-(dotY-dotRadius) / (canvas.height-2*dotRadius) * 100).toFixed(2);
    relativeWidth = ((dotX-dotRadius) / (canvas.width-2*dotRadius) * 100).toFixed(2);
    // document.getElementById('dotHeightValue').textContent = relativeHeight;
    // document.getElementById('dotWidthValue').textContent = relativeWidth;
}

//handle mouse events
function handleMouseDown(e) {
    if (isInsideDot(e.offsetX, e.offsetY)) {
        isDragging = true;
    }
}

function handleMouseMove(e) {
    if (isDragging) {
        dotX = e.offsetX;
        dotY = e.offsetY;
        keepDotWithinBounds();
        draw();
    }
}

function handleMouseUp() {
    isDragging = false;
}

//handle touch events
function handleTouchStart(e) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    if (isInsideDot(touchX, touchY)) {
        isDragging = true;
    }
}

function handleTouchMove(e) {
    if (isDragging) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        dotX = touch.clientX - rect.left;
        dotY = touch.clientY - rect.top;
        keepDotWithinBounds();
        draw();
    }
    e.preventDefault(); // Prevent scrolling
}

function handleTouchEnd() {
    isDragging = false;
}

//make sure dot is selected
function isInsideDot(x, y) {
    const dx = x - dotX;
    const dy = y - dotY;
    return (dx * dx + dy * dy) <= (dotRadius * dotRadius);
}

//make sure dot is within the canvas border
function keepDotWithinBounds() {
    if (dotX - dotRadius < 0) dotX = dotRadius;
    if (dotX + dotRadius > canvas.width) dotX = canvas.width - dotRadius;
    if (dotY - dotRadius < 0) dotY = dotRadius;
    if (dotY + dotRadius > canvas.height) dotY = canvas.height - dotRadius;
}

// Attach event listeners
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

//chart handler
let count = 0;
function updateChart() {
    FMspeed = relativeHeight;
    DGspeed = relativeWidth;

    FMData.push(100-relativeHeight);
    FMData.shift();
    DGData.push(100-relativeWidth);
    DGData.shift();

    CreateChart(FMchart,FMData);
    CreateChart(DGchart,DGData);
}

// Function to create the dynamic bar chart
function CreateChart(chartContainer,data) {
    chartContainer.innerHTML = ''; // Clear existing chart

    /*
    // Get wrapper dimensions
    const wrapperWidth = canvas.parentElement.offsetWidth;
    const wrapperHeight = canvas.parentElement.offsetHeight;

    // Set canvas dimensions
    canvas.width = wrapperWidth;
    canvas.height = wrapperHeight;
    */

    data.forEach(value => {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.style.height = `${value}%`;
        //bar.textContent = value;
        chartContainer.appendChild(bar);
    });
}

// Attach event listener to window's resize event
window.addEventListener('resize', draw(true));

// Init
draw(true);
let intervalId = setInterval(updateChart, 50);