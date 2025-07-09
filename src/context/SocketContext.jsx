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
			// Create real Socket.IO connection
			const socketConnection = io(
					"https://collaborative-to-do-board-application.onrender.com",
				{
					auth: {
						userId: user.id,
						userName: user.name,
					},
					transports: ["websocket", "polling"],
					timeout: 20000,
				}
			);

			// Connection event handlers
			socketConnection.on("connect", () => {
				console.log("✅ Socket connected:", socketConnection.id);
				setIsConnected(true);
			});

			socketConnection.on("disconnect", (reason) => {
				console.log("❌ Socket disconnected:", reason);
				setIsConnected(false);
			});

			socketConnection.on("connect_error", (error) => {
				console.error("🚫 Socket connection error:", error);
				setIsConnected(false);
			});

			setSocket(socketConnection);

			return () => {
				console.log("Cleaning up socket connection");
				socketConnection.disconnect();
				setSocket(null);
				setIsConnected(false);
			};
		} else {
			// User logged out, clean up socket
			if (socket) {
				socket.disconnect();
				setSocket(null);
				setIsConnected(false);
			}
		}
	}, [user]); // socket is not needed in deps as it's set inside the effect

	const value = {
		socket,
		isConnected,
	};

	return (
		<SocketContext.Provider value={value}>{children}</SocketContext.Provider>
	);
};
