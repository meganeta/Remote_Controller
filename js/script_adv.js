let apply = document.getElementById('apply');
let reset = document.getElementById('reset');
let chart = document.getElementById('myChart');
let advanced_period = document.getElementById('advanced_period');
let inst = document.getElementById('inst');

var wave_datasets = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50];
var chart_labels = ['0.0', '0.2', '0.4', '0.6', '0.8', '1.0', '1.2', '1.4', '1.6', '1.8'];

var value = getCookie('meganeta_data');
if (value != null) {
  wave_datasets = JSON.parse(value);
  console.log(wave_datasets);
}

var value = getCookie('meganeta_data_mode');
if (value != null) {
  advanced_period.value = value;
  
  if (value == "0") {
    chart_labels = ['0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9'];
    inst.innerText = "图表表示了1秒周期内的相对速度曲线，请调整曲线来实现自定义波形，推荐横屏使用。";
  } else if (value == "1") {
    chart_labels = ['0.0', '0.2', '0.4', '0.6', '0.8', '1.0', '1.2', '1.4', '1.6', '1.8'];
    inst.innerText = "图表表示了2秒周期内的相对速度曲线，请调整曲线来实现自定义波形，推荐横屏使用。";
  } else {
    chart_labels = ['0.0', '0.4', '0.8', '1.2', '1.6', '2.0', '2.4', '2.8', '3.2', '3.6'];
    inst.innerText = "图表表示了4秒周期内的相对速度曲线，请调整曲线来实现自定义波形，推荐横屏使用。";
  }
}

window.onresize = function(){
    window.location.reload();
}

// Initial data for the chart
let initialData = {
    labels: chart_labels,
    datasets: [{
      label: '相对速度',
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgb(255, 99, 132)',
      data: wave_datasets,
      fill: false,
    }]
  };
  
  // Configuration for the chart
  const config = {
    type: 'line',
    data: initialData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false, // Hide legend
        },
        title: {
          display: true,
          color: "#f1f1f1",
          text: '动态自选波形',
          font: {
            size:20
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            color: "#f1f1f1",
            text: '时间（秒）'
          },
          ticks: {
            color: "#f1f1f1" // Set color of x-axis values
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            color: "#f1f1f1",
            text: '相对速度（%）'
          },
          ticks: {
            color: "#f1f1f1" // Set color of x-axis values
          },
          min:0,
          max:100
        }
  
      }
    },
  };
  
  // Create a new chart instance
  var myChart = new Chart(chart, config);
  
  var isDragging = false;
  var sel_point = false;
  var dataIndex = 0;
  var mouseY_init = 0;
  var init_data = 0;
  var dynamic_factor = 0.5;
  
  function drag_start(event){
    console.log("down");
    event.preventDefault();
    isDragging = true;
  }
  
  function drag_end(event){
    console.log("up");
    isDragging = false;
    sel_point = false;

    wave_datasets = myChart.data.datasets[0].data;

    setCookie("meganeta_data", JSON.stringify(wave_datasets), 30);
  }
  
  function dragging(event){
    event.preventDefault();
    if (isDragging) {
      if (!sel_point) {
        let mouseX = event.clientX - this.getBoundingClientRect().left;
        mouseY_init = event.clientY;
        let chartArea = myChart.chartArea;
        dataIndex = Math.floor((mouseX / this.getBoundingClientRect().width) * myChart.data.datasets[0].data.length);
        if (dataIndex < myChart.data.datasets[0].data.length) {
          sel_point = true;
          init_data = myChart.data.datasets[0].data[dataIndex];
        }

        dynamic_factor = 150/(this.getBoundingClientRect().height);
      } else {
        let mouseY = event.clientY;
        // Update data point value if within range
        var value = Math.round((mouseY_init - mouseY)*dynamic_factor + init_data);
        if (value > 100) {
          value = 100;
        } else if (value < 0) {
          value = 0;
        }
        myChart.data.datasets[0].data[dataIndex] = value;
        myChart.update('none');
      }
    }
  }

  function touch_dragging(event){
    event.preventDefault();
    if (isDragging) {
      if (!sel_point) {
        let mouseX = event.touches[0].clientX - this.getBoundingClientRect().left;
        mouseY_init = event.touches[0].clientY;
        let chartArea = myChart.chartArea;
        dataIndex = Math.floor((mouseX / this.getBoundingClientRect().width) * myChart.data.datasets[0].data.length);
        if (dataIndex < myChart.data.datasets[0].data.length) {
          sel_point = true;
          init_data = myChart.data.datasets[0].data[dataIndex];
        }

        dynamic_factor = 150/(this.getBoundingClientRect().height);
      } else {
        let mouseY = event.touches[0].clientY;
        // Update data point value if within range
        var value = Math.round((mouseY_init - mouseY)*dynamic_factor + init_data);
        if (value > 100) {
          value = 100;
        } else if (value < 0) {
          value = 0;
        }
        myChart.data.datasets[0].data[dataIndex] = value;
        myChart.update('none');
      }
    }
  }
  
  // Add event listeners for mouse and touch interactions
  chart.addEventListener('mousedown', drag_start);
  chart.addEventListener('mousemove', dragging);
  chart.addEventListener('mouseup', drag_end);
  chart.addEventListener('mouseleave', drag_end);

  chart.addEventListener('touchstart', drag_start);
  chart.addEventListener('touchmove', touch_dragging);
  chart.addEventListener('touchend', drag_end);
  

apply.onclick = function () {

  socket.send("chart" + "/" + JSON.stringify(wave_datasets) + "/" + advanced_period.value);
}

reset.onclick = function() {
  wave_datasets = [50, 50, 50, 50, 50, 50, 50, 50, 50, 50];
  deleteCookie("meganeta_data");
  myChart.data.datasets[0].data = wave_datasets;
  

  advanced_period.value = "1";
  myChart.data.labels = ['0.0', '0.2', '0.4', '0.6', '0.8', '1.0', '1.2', '1.4', '1.6', '1.8'];
  inst.innerText = "图表表示了2秒周期内的相对速度曲线，请调整曲线来实现自定义波形，推荐横屏使用。";
  deleteCookie('meganeta_data_mode');

  myChart.update("none");
}

advanced_period.oninput = function() {
  var opt = advanced_period.value;
  setCookie('meganeta_data_mode',opt,30);
  if (opt == "0") {
    myChart.data.labels = ['0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9'];
    inst.innerText = "图表表示了1秒周期内的相对速度曲线，请调整曲线来实现自定义波形，推荐横屏使用。";
  } else if (opt == "1") {
    myChart.data.labels = ['0.0', '0.2', '0.4', '0.6', '0.8', '1.0', '1.2', '1.4', '1.6', '1.8'];
    inst.innerText = "图表表示了2秒周期内的相对速度曲线，请调整曲线来实现自定义波形，推荐横屏使用。";
  } else {
    myChart.data.labels = ['0.0', '0.4', '0.8', '1.2', '1.6', '2.0', '2.4', '2.8', '3.2', '3.6'];
    inst.innerText = "图表表示了4秒周期内的相对速度曲线，请调整曲线来实现自定义波形，推荐横屏使用。";
  }

  myChart.update("none");
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
        if (res[0] == "chart" && +res[1]) {
            window.alert("Wave Updated!");
        } else {
            window.alert("Incorrect Wave!");
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