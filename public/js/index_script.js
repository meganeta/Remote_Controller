let stop = document.getElementById('stop');

let FMspeed = 0;
let DGspeed = 0;

let horizontalText = "郊 狼";
let verticalText = "炮 机";


//emergency stop button
stop.onclick = function(){
    try {
        if (wsConn != null) {
            SendtoFM(0);
            addOrIncrease(3, 1, 0); //A to speed
            addOrIncrease(3, 2, 0); //B to speed
            clearAB(1);
            clearAB(2);
        }
    }
    catch (e) {
        console.error(e);
    }
    
    console.log("STOP");
    
    FMspeed = 0;
    DGspeed = 0;

    dotX = dotRadius;
    dotY = canvas.height-dotRadius;
    draw();
};

//update speed/strength
function SendtoMachine() {
    if (con_status == 1) {
        //DG
        if (wsConn != null) {
            addOrIncrease(3, 1, parseInt(DGspeed/2)); //A to speed
            addOrIncrease(3, 2, parseInt(FMspeed/2)); //B to speed
            
            sendCustomMsg(DG_wave);
        }

        console.log("DG A Speed: "+DGspeed.toString());
        console.log("DG B Speed: "+FMspeed.toString());

    } else if (con_status == 2) {
        //FM
        console.log("FM Speed: "+FMspeed.toString());

        if (wsConn != null) {
            SendtoFM(FMspeed);

            addOrIncrease(3, 1, 0); //A to speed
            addOrIncrease(3, 2, 0); //B to speed
        }

    } else if (con_status == 3) {
        //Both
        if (wsConn != null) {
            SendtoFM(FMspeed);

            addOrIncrease(3, DG_channel, parseInt(DGspeed/2)); //A to speed
            addOrIncrease(3, (DG_channel-1?1:2), 0); //B to speed
    
            sendCustomMsg(DG_wave);
        }

        console.log("DG Speed: "+DGspeed.toString());
        console.log("FM Speed: "+FMspeed.toString());
    } else {
        console.log("DG Speed: "+DGspeed.toString());
        console.log("FM Speed: "+FMspeed.toString());
        console.log("赛博控制！");
    }
}

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

    if(resize || con_status_flg){
        con_status_flg = false;
        console.log("Resize!")
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
    
    // Horizontal Text at Bottom Center
    
    if (con_status == 0) {
        horizontalText = "赛 博 郊 狼";
        verticalText = "赛 博 炮 机";
    } else if (con_status == 1) {
        DGchannel.disabled = true;
        horizontalText = "通 道 A";
        verticalText = "通 道 B";
    } else if (con_status == 2) {
        horizontalText = "";
        verticalText = "炮 机";
    } else if (con_status == 3) {
        horizontalText = "郊 狼";
        verticalText = "炮 机";
    }
    
    ctx.font = '25px Arial';
    ctx.fillStyle = 'white';
    const horizontalTextWidth = ctx.measureText(horizontalText).width;
    const horizontalTextX = (canvas.width - horizontalTextWidth) / 2;
    const horizontalTextY = canvas.height - 20; // 20px above the bottom
    ctx.fillText(horizontalText, horizontalTextX, horizontalTextY);
    
    // Vertical Text at Left Center
    ctx.save();
    const verticalTextWidth = ctx.measureText(verticalText).width;
    ctx.translate(20, (canvas.height + verticalTextWidth) / 2); // Move to the left center
    ctx.rotate(-Math.PI / 2); // Rotate counterclockwise by 90 degrees
    ctx.fillText(verticalText, 0, 0);
    ctx.restore(); // Restore the previous state

    //update speed
    relativeHeight = parseInt(100-(dotY-2.5*dotRadius) / (canvas.height-5*dotRadius) * 100);
    relativeWidth = parseInt((dotX-2.5*dotRadius) / (canvas.width-5*dotRadius) * 100);

    if (relativeHeight < 0) {
        relativeHeight = 0;
    } else if (relativeHeight > 100) {
        relativeHeight = 100;
    }

    if (relativeWidth < 0) {
        relativeWidth = 0;
    } else if (relativeWidth > 100) {
        relativeWidth = 100;
    }

    FMspeed = relativeHeight;
    DGspeed = relativeWidth;

    SendtoMachine();
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

    if (!canvas.contains(e.target)) {
        handleTouchEnd();
    }
}

function handleTouchEnd() {
    isDragging = false;
}

//make sure dot is selected
function isInsideDot(x, y) {
    return true;
    /*
    const dx = x - dotX;
    const dy = y - dotY;
    return (dx * dx + dy * dy) <= (dotRadius * dotRadius);
    */
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
canvas.addEventListener('mouseleave', handleMouseUp);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

//chart handler
let count = 0;
function updateChart() {
    FMData.push(100-FMspeed);
    FMData.shift();
    DGData.push(100-DGspeed);
    DGData.shift();

    CreateChart(FMchart,FMData,verticalText);
    CreateChart(DGchart,DGData,horizontalText);

    //SendtoMachine();
}

// Function to create the dynamic bar chart
function CreateChart(chartContainer,data,BackText) {
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

    set_chart_text(chartContainer,100-data[data.length-1],BackText);
}

function set_chart_text(chartContainer,Speed,BackText){
    const rect = chartContainer.getBoundingClientRect();
    
    const text = document.createElement('div');
    text.classList.add('background-text');
    text.style.bottom = (rect.top - rect.bottom)/2 + rect.bottom; // Position the text above the bar
    text.textContent = BackText+": "+Speed.toString();
    chartContainer.appendChild(text);
}

//handle dropdown menus
let DG_channel = 1;
let DG_wave = "1";

const DGchannel = document.getElementById('DGchannel');
DGchannel.addEventListener('change', function() {
    DG_channel = DGchannel.value;
    console.log('Selected channel:', DG_channel);
});

const DGwave = document.getElementById('DGwave');
DGwave.addEventListener('change', function() {
    DG_wave = DGwave.value;
    console.log('Selected Wave:', DG_wave);
});

// Attach event listener to window's resize event
window.addEventListener('resize', function() {
    draw(true)
});

// Init
draw(true);
let intervalId = setInterval(updateChart, 50);

// Welcome Info
window.onload = function() {
    alert("欢迎来控メガネタ捏！\n左右控制郊狼，上下控制炮机\nChangelog v1.0a\n加入了炮机郊狼联控控件\n加入了郊狼连接机制\n");
};