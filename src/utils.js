function log(message) {
  console.log(`[${new Date().toLocaleString()}] ${message}`);
}

// You might add other utility functions here later, like sendNotification

module.exports = { log };