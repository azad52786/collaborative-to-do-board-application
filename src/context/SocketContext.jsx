import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
	const context = useContext(SocketContext);
	if (!context) {
		throw new Error("useSocket must be used within a SocketProvider");
	}
	return context;
};

export const SocketProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [isConnected, setIsConnected] = useState(false);
	const { user } = useAuth();

	useEffect(() => {
		if (user) {
			// Mock socket connection - replace with actual Socket.IO connection
			const mockSocket = {
				emit: (event, data) => {
					console.log("Socket emit:", event, data);
				},
				on: (event, callback) => {
					console.log("Socket listener added:", event);
					// Mock some events for demonstration
					if (event === "connect") {
						setTimeout(() => callback(), 100);
					}
				},
				off: (event, _callback) => {
					console.log("Socket listener removed:", event);
				},
				disconnect: () => {
					console.log("Socket disconnected");
					setIsConnected(false);
				},
			};

			setSocket(mockSocket);
			setIsConnected(true);

			return () => {
				if (mockSocket) {
					mockSocket.disconnect();
				}
			};
		}
	}, [user]);

	const value = {
		socket,
		isConnected,
	};

	return (
		<SocketContext.Provider value={value}>{children}</SocketContext.Provider>
	);
};
