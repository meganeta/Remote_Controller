let stop = document.getElementById('stop');
let speed_ind = document.getElementById('indicator');


//resize element with webpage
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



//emergency stop button
stop.onclick = function(){
    console.log("STOP");
    speed = 0;
    updatespeed();
};

//update speed/strength
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