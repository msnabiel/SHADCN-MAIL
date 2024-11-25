const { SerialPort } = require("serialport");
const WebSocket = require("ws");

// Create the serial port connection to the Arduino
const port = new SerialPort({
  path: "/dev/cu.usbmodem11101", // Update with your actual serial port path
  baudRate: 9600,
});

const wss = new WebSocket.Server({ port: 8080 });
console.log("WebSocket server is running on ws://localhost:8080");

let bufferedData = "";

// Listen for data from the serial port (Arduino)
port.on("data", (data) => {
  bufferedData += data.toString();

  // If a full line is received (using newline as a delimiter)
  if (bufferedData.includes("\n")) {
    // Split data by comma and parse each value
    const values = bufferedData.trim().split(",");

    if (values.length === 4) {  // Expect 4 values: TDS voltage, water level, pump status, and bio-exg value
      const tds = parseFloat(values[0]);             // First value as TDS voltage
      const waterLevel = parseInt(values[1], 10);    // Second value as water level (cm)
      const pumpStatus = values[2].trim();           // Third value as pump status (ON/OFF)
      const bioExg = parseFloat(values[3]);          // Fourth value as Bio-ExG value

      // Structure the data to send to the frontend
      const dataObj = {
        tds,                 // TDS value
        ph: 0,               // Placeholder for pH value (could be added later)
        waterLevel,          // Water level in cm
        pumpStatus,          // Pump status (ON/OFF)
        bioExg               // Bio-ExG value
      };

      // Broadcast the data to all connected WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(dataObj)); // Send data as a JSON string
        }
      });
    }

    // Clear the buffered data for the next message
    bufferedData = "";
  }
});

// Error handling for serial port
port.on("error", (err) => {
  console.error("Serial Port Error:", err.message);
});