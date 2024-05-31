let connect = document.getElementById('connect');

let light = document.getElementById('light');
let moderate = document.getElementById('moderate');
let strong = document.getElementById('strong');
let brutal = document.getElementById('brutal');

var user_count = document.getElementById('user_count');
var client_id = document.getElementById('client_id');

var username = "变态";

window.onload = function(){
    var value = getCookie("meganeta_username");
    if (value == null) {
        generateUniqueId();
    } else {
        username = value;
        client_id.value = username;
    }
}

client_id.oninput = function () {
    if (client_id.value.length > 20) {
        window.alert("用户名过长！")
        client_id.value = username;
        setCookie("meganeta_username", username, 3);
    }
}

function generateUniqueId() {
    // Get the current timestamp in milliseconds
    var timestamp = String(new Date().getTime()).slice(-3);
    
    // Generate a random number between 0 and 9999
    var randomNumber = Math.floor(Math.random() * 10000);
    
    // Combine timestamp and random number to create a unique ID
    var uniqueId = timestamp + "_" + randomNumber;
    
    username = username + "@" + uniqueId;
    client_id.value = username;

    setCookie("meganeta_username", username, 30);
}

function addRow(name,mode,time) {
    var table = document.getElementById("exec_table").getElementsByTagName('tbody')[0];
    var newRow = table.insertRow();
    var cell1 = newRow.insertCell(0);
    var cell2 = newRow.insertCell(1);
    var cell3 = newRow.insertCell(2);
    cell1.innerHTML = String(name);
    cell2.innerHTML = String(mode);
    cell3.innerHTML = String(time);
}

function deleteRow(row_num){
    var table = document.getElementById("exec_table");
    table.deleteRow(rowNumber);
}

// Function to set a cookie
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Function to get a cookie value by name
function getCookie(name) {
    var nameEQ = name + "=";
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }
    return null;
}

// Function to delete a cookie by name
function deleteCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

light.onclick = function(){
    if(client_id.value.length>0){
        username = client_id.value;
    }

    socket.send("tab"+'/'+username+'/'+'0');
}

moderate.onclick = function(){
    if(client_id.value.length>0){
        username = client_id.value;
    }

    socket.send("tab"+'/'+username+'/'+'1');
}

strong.onclick = function(){
    if(client_id.value.length>0){
        username = client_id.value;
    }

    socket.send("tab"+'/'+username+'/'+'2');
}

brutal.onclick = function(){
    if(client_id.value.length>0){
        username = client_id.value;
    }

    socket.send("tab"+'/'+username+'/'+'3');
}

var loc = window.location;
var socketURL = (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host;// + '/path';
var socket = new WebSocket(socketURL);

// WebSocket connection established
socket.onopen = function() {
    console.log('Controller connected.');

    // Send a message to the server
    socket.send("con");
};

// Handle incoming messages from the server
socket.onmessage = function(event) {
    var message = event.data;

    console.log('Received message:', message);

    var res = message.split("/");

    if (res.length == 1) {
        if(+res[0] == 1) {
            connect.innerText = "已连接";
            con_status = true;
        } else {
            connect.innerText = "未连接";
            con_status = false;
        }
    }

    if (res.length == 4) {
        // Process the message or perform any desired action
        if (res[0] == "tab1") {
            addRow(res[1],res[2],res[3]);
        } else if (res[0] == "tab0") {
            deleteRow(0);
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