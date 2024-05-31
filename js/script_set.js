let apply = document.getElementById('apply');
let reset = document.getElementById('reset');

var ip_addr = document.getElementById('ip_addr');
var max_speed = document.getElementById('max_speed');
var max_client = document.getElementById('max_client');
var advanced = document.getElementById('advanced');
var duration = document.getElementById('duration');
var password = document.getElementById('password');

window.onload = function() {
    ip_addr.value = "127.0.0.1:8080";
    max_speed.value = 0;
    max_client.value = 0;
    advanced.value = "0";
    duration.value = 30;
}

max_speed.oninput = function () {
    if (max_speed.value > 99 || max_speed.value < 0) {
        max_speed.value = 0;
    }
}

max_client.oninput = function () {
    if (max_client.value > 50 || max_client.value < 0) {
        max_client.value = 0;
    }
}

duration.oninput = function () {
    if (duration.value > 99 || duration.value < 0) {
        duration.value = 30;
    }
}

apply.onclick = function () {
    socket.send(String(ip_addr) + "/" + String(max_speed.value) + "/" + String(max_client.value) + "/" + String(advanced.value) + "/" + String(duration.value) + "/" + String(password.value));
}

reset.onclick = function() {
    ip_addr.value = "127.0.0.1:8080";
    max_speed.value = 0;
    max_client.value = 0;
    advanced.value = "0";
    duration.value = 30;
    password.value = "";
}

var loc = window.location;
var socketURL = (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host;// + '/path';
var socket = new WebSocket(socketURL);

// WebSocket connection established
socket.onopen = function() {
console.log('Controller connected.');

// Send a message to the server
//socket.send('Hello, server!');
};

// Handle incoming messages from the server
socket.onmessage = function(event) {
    var message = event.data;

    console.log('Received message:', message);

    var res = message.split("/");

    if (res.length == 2) {
        // Process the message or perform any desired action
        if (res[0] == "set" && +res[1]) {
            window.alert("Settings Updated!");
        } else {
            window.alert("Incorrect Password!");
        }
    }
};

// WebSocket connection closed
socket.onclose = function(event) {
console.log('WebSocket connection closed with code:', event.code);
};

// Handle errors
socket.onerror = function(error) {
console.error('WebSocket error:', error);
};

//load new html
function loadNewHTML(event, url) {
    // Prevent the default behavior of the anchor tag
    event.preventDefault();

    // Fetch the content of the new HTML file
    fetch(url)
        .then(response => response.text())
        .then(data => {
        // Update the current page with the content of the new HTML file
        document.open();
        document.write(data);
        document.close();
        })
        .catch(error => console.error('Error loading HTML:', error));
}