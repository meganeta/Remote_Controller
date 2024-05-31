var con_status = false;
var speed = 0;
/*
mode 
0: static
1: sine
2: rec
4: custom
*/
var mode = 0;

let connect = document.getElementById('connect');
let advanced = document.getElementById('advanced');

var loc = window.location;
var socketURL = (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host;

var socket = new WebSocket(socketURL);

// WebSocket connection established
socket.onopen = function() {
    console.log('WebSocket connection established.');
  
    // Send a message to the server
    socket.send("con");
};

// Handle incoming messages from the server
socket.onmessage = function(event) {
    var message = event.data;
    console.log('Received message:', message);

    var res = message.split("/");
    
    if (res.length == 4) {
        // Process the message or perform any desired action
        /*
        width = res[0];
        height = res[1];
        hsize = res[2];
        spacing = res[3];
        */

        socket.send(res);
    } else if (res.length == 1) {
        if(+res[0] == 1) {
            connect.innerText = "已连接";
            con_status = true;
        } else {
            connect.innerText = "未连接";
            con_status = false;
        }
        socket.send("adv");
    } else if (res.length == 2) {
        if(res[0] == "adv" && +res[1]) {
            advanced.options[3].text = "自选（高级模式）";
        } else {
            advanced.options[3].text = "不可用（高级模式）";
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