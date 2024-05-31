let up = document.getElementById('up');
let down = document.getElementById('down');
let stop = document.getElementById('stop');
let speed_ind = document.getElementById('indicator');
let advanced_mode = document.getElementById('advanced_mode');

/*
$(window).ready(updateHeight);
$(window).resize(updateHeight);

function updateHeight()
{
    var con = $('container');
    con.css('height', dicanvas.height());
}
*/

window.onload = function() {

    var container = document.getElementById('container');
    
    function adjustFontSize() {

        var containerWidth = container.offsetWidth;
        var containerHeight = container.offsetHeight;
        var fontSize = Math.min(containerWidth, containerHeight) * 0.5; // Adjust multiplier as needed
        speed_ind.style.fontSize = fontSize + 'px';
        console.log(fontSize);
    }

    speed_ind.textContent = "00";
    adjustFontSize();

    window.addEventListener('resize', adjustFontSize);
};

function updatespeed() {
    socket.send(String(speed) + "/" + String(mode));
    if (speed<10) {
        speed_ind.textContent = "0"+speed.toString();
    } else if (speed > 98) {
        speed_ind.textContent = "MAX";
    } else {
        speed_ind.textContent = speed.toString();
    }
}

advanced_mode.oninput = function(){
    console.log("mode");
    mode = advanced_mode.value;
}

up.onclick = function(){
    console.log("UP");
    if (speed < 99) {
        speed = speed + 1;
        updatespeed();
    }
};

down.onclick = function(){
    console.log("DOWN");
    if (speed > 0) {
        speed = speed - 1;
        updatespeed();
    }
};

stop.onclick = function(){
    console.log("STOP");
    speed = 0;
    updatespeed();
};

let pressTimer;

up.addEventListener("mousedown", startPressUp);
up.addEventListener("mouseup", endPress);
up.addEventListener("mouseleave", cancelPress);
up.addEventListener("touchstart", startPressUp);
up.addEventListener("touchend", endPress);
up.addEventListener("touchcancel", cancelPress);

down.addEventListener("mousedown", startPressDown);
down.addEventListener("mouseup", endPress);
down.addEventListener("mouseleave", cancelPress);
down.addEventListener("touchstart", startPressDown);
down.addEventListener("touchend", endPress);
down.addEventListener("touchcancel", cancelPress);

function startPressUp() {
    pressTimer = setInterval(function() {
        if (speed < 99) {
            speed = speed + 1;
            updatespeed();
        }
    }, 100);
}

function startPressDown() {
    pressTimer = setInterval(function() {
        if (speed > 0) {
            speed = speed - 1;
            updatespeed();
        }
    }, 100);
}

function endPress() {
    clearTimeout(pressTimer);
}

function cancelPress() {
    clearTimeout(pressTimer);
}