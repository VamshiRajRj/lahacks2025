"use client";

import { useState, useEffect, useRef } from "react";
import ChatPrompt from "@/components/ChatPrompt";
import CameraModal from "@/components/CameraModal";
import BillSplitPreview from "@/components/BillSplitPreview";
import { TransactionType } from "@/types/TransactionsType";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";

// Backend URL
const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL; // adjust if needed

type ChatMessage =
	| { id: number; type: "bill"; sender: "gpt"; transaction: TransactionType }
	| {
			id: number;
			type: "image+text";
			sender: "user" | "gpt";
			imageUrl: string;
			message: string;
	  };

export default function ChatPage() {
	const [cameraOpen, setCameraOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [captureCallback, setCaptureCallback] = useState<
		((photoUrl: string) => void) | null
	>(null);
	const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
	const { addTransaction } = useApp();
	const router = useRouter();

	useEffect(() => {
		const lastMsg = messages[messages.length - 1];
		if (lastMsg && messageRefs.current[lastMsg.id]) {
			messageRefs.current[lastMsg.id]?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	}, [messages]);

	const sendMessageToBackend = async (userMessage: ChatMessage) => {
		try {
			// Add a loading bubble first
			const loadingId = Date.now() + 1;
			setMessages((prev) => [
				...prev,
				{
					id: loadingId,
					type: "image+text",
					sender: "gpt",
					imageUrl: "",
					message: "Loading...",
				},
			]);

			const res = await fetch(`${BASE_URL}/chat/gpt`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(userMessage),
			});

			const data = await res.json();

			// Replace the loading message with real response
			setMessages((prev) =>
				prev.map((msg) =>
					msg.id === loadingId
						? {
								id: loadingId,
								type: "bill",
								sender: "gpt",
								transaction: data,
						  }
						: msg
				)
			);
		} catch (error) {
			console.error("Failed to send message:", error);
		}
	};

	const handleSendMessage = (text: string, image: string) => {
		console.log("Sending message:", text, image);
		if (text.trim() !== "" || image !== "") {
			const userMessage: ChatMessage = {
				id: Date.now(),
				type: "image+text",
				sender: "user",
				imageUrl: image,
				message: text.trim(),
			};
			setMessages((prev) => [...prev, userMessage]);
			sendMessageToBackend(userMessage);
		}
	};

	const handleCameraUpload = (
		onCaptureCallback: (photoUrl: string) => void
	) => {
		setCameraOpen(true);
		setCaptureCallback(() => onCaptureCallback);
	};

	const uploadImageToImgbb = async (photoUrl: string) => {
		const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
		const formData = new FormData();
		formData.append("image", photoUrl.split(",")[1]); // remove data:image/...base64, header

		const response = await fetch(
			`https://api.imgbb.com/1/upload?key=${apiKey}`,
			{
				method: "POST",
				body: formData,
			}
		);

		const data = await response.json();
		return data.data.url;
	};

	const handleCapturePhoto = async (photoUrl: string) => {
		if (captureCallback) {
			const uploadedUrl = await uploadImageToImgbb(photoUrl);
			captureCallback(uploadedUrl);
		}
		setCameraOpen(false);
	};

	const handleConfirmBill = (transaction: TransactionType) => {
		addTransaction(transaction);
		console.log("Bill Confirmed and saved:", transaction);
		setMessages([]);
		router.push("/transactions");
	};

	const handleCancelBill = () => {
		console.log("Bill Cancelled!");
		setMessages([]);
	};

	return (
		<div className="flex flex-col h-full max-h-screen bg-gray-50">
			{/* Chat area */}
			<div className="flex-1 p-4 flex flex-col gap-4">
				<div className="flex flex-col items-center justify-center text-center mb-6">
					<h1 className="text-gray-700 font-bold text-3xl mb-2">
						Ask me anything
					</h1>
					<p className="text-gray-500 text-lg max-w-2xl mx-7">
						I can help you with questions about your bills, add new
						bills, or split bills with friends.
					</p>
				</div>

				{messages.map((msg) => (
					<div
						key={msg.id}
						ref={(el) => {
							messageRefs.current[msg.id] = el;
						}}
						className="w-full flex flex-col"
					>
						{/* Render user message */}
						{msg.type === "image+text" && msg.sender === "user" && (
							<div className="flex flex-col items-end gap-2">
								{msg.imageUrl && (
									<div className="flex flex-wrap gap-2 justify-end">
										<img
											src={msg.imageUrl}
											alt="Captured"
											className="w-32 h-32 object-cover rounded-lg shadow"
										/>
									</div>
								)}
								{msg.message && (
									<div className="max-w-xs px-3 py-2 bg-blue-500 text-white rounded-lg">
										{msg.message}
									</div>
								)}
							</div>
						)}

						{/* Render loading bubble */}
						{msg.type === "image+text" &&
							msg.sender === "gpt" &&
							msg.message === "Loading..." && (
								<div className="max-w-xs px-3 py-2 rounded-lg bg-gray-300 text-gray-700 animate-pulse mr-auto">
									{msg.message}
								</div>
							)}

						{/* Render final bill */}
						{msg.type === "bill" && (
							<BillSplitPreview
								transaction={msg.transaction}
								onConfirm={() =>
									handleConfirmBill(msg.transaction)
								}
								onCancel={handleCancelBill}
							/>
						)}
					</div>
				))}
			</div>

			{/* Chat input */}
			<div className="border-t border-gray-200 p-4 bg-white sticky bottom-0">
				<ChatPrompt
					onCameraClick={handleCameraUpload}
					onSendMessage={handleSendMessage}
				/>
			</div>

			{/* Camera Modal */}
			<CameraModal
				open={cameraOpen}
				onClose={() => setCameraOpen(false)}
				onCapture={handleCapturePhoto}
			/>
		</div>
	);
}
