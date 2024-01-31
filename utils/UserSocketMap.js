// UserSocketMap.js

class SocketMap {
	constructor () {
		this.userSockets = new Map();
	}

	// Method to add a user ID and WebSocket object to the map
	addUserSocket (userId, ws) {
		this.userSockets.set(userId, ws);
	}

	// Method to remove a user ID and WebSocket object from the map
	removeUserSocket (userId) {
		this.userSockets.delete(userId);
	}

	// Method to retrieve the WebSocket object associated with a user ID
	getUserSocket (userId) {
		return this.userSockets.get(userId);
	}
}

// Export the UserSocketMap class for use in other modules
const userSocketMap = new SocketMap();
module.exports = userSocketMap;
