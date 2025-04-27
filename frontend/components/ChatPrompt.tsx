"use client";

import { CameraIcon, SendIcon, PaperclipIcon, XIcon } from "lucide-react";
import { useState, useRef } from "react";

interface ChatPromptProps {
	onCameraClick: (onCaptureCallback: (photoUrl: string) => void) => void;
	onSendMessage: (text: string, image: string) => void;
}

export default function ChatPrompt({
	onCameraClick,
	onSendMessage,
}: ChatPromptProps) {
	const [text, setText] = useState("");
	const [selectedImage, setSelectedImage] = useState<string>("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Read the file as base64 first
		const reader = new FileReader();
		reader.onloadend = async () => {
			if (reader.result) {
				const base64String = reader.result as string;

				try {
					// Upload to imgbb
					const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
					const formData = new FormData();
					formData.append("image", base64String.split(",")[1]); // remove "data:image/png;base64," part

					const response = await fetch(
						`https://api.imgbb.com/1/upload?key=${apiKey}`,
						{
							method: "POST",
							body: formData,
						}
					);

					const data = await response.json();

					if (data.success) {
						const uploadedImageUrl = data.data.url;
						console.log("Uploaded image URL:", uploadedImageUrl);
						setSelectedImage(uploadedImageUrl); // ✅ set the cloud URL now
					} else {
						console.error("Image upload failed:", data);
					}
				} catch (error) {
					console.error("Image upload error:", error);
				}
			}
		};

		reader.readAsDataURL(file);
	};

	const handleSend = () => {
		if (text.trim() !== "" || selectedImage !== "") {
			onSendMessage(text.trim(), selectedImage);
			setText("");
			setSelectedImage("");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleAddCameraImage = (photoUrl: string) => {
		setSelectedImage(photoUrl);
	};

	const removeImage = () => {
		setSelectedImage("");
	};

	return (
		<div className="sticky left-0 right-0 p-3 rounded-2xl border border-gray-300 border-dashed border-2 px-4 py-3 bg-gray-100 flex flex-col gap-2 md:left-64">
			{/* Selected Images Preview */}
			{selectedImage !== "" && (
				<div className="flex gap-2 overflow-x-auto pb-2">
					<div className="relative">
						<img
							src={selectedImage}
							alt="Selected"
							className="w-20 h-20 object-cover rounded-md border"
						/>
						<button
							onClick={() => removeImage()}
							className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-md"
						>
							<XIcon className="h-4 w-4 text-gray-600" />
						</button>
					</div>
				</div>
			)}

			{/* Text Area */}
			<textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Start typing..."
				rows={3}
				className="flex-1 resize-none outline-none bg-transparent"
			/>

			{/* Actions */}
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-2">
					<button
						onClick={() => onCameraClick(handleAddCameraImage)}
						className="p-2 rounded-full bg-gray-100 border border-gray-300 hover:bg-gray-200"
						aria-label="Camera"
					>
						<CameraIcon className="h-5 w-5 text-gray-600" />
					</button>
					<button
						onClick={handleFileSelect}
						className="p-2 rounded-full bg-gray-100 border border-gray-300 hover:bg-gray-200"
						aria-label="Attach file"
					>
						<PaperclipIcon className="h-5 w-5 text-gray-600" />
					</button>
					<input
						type="file"
						ref={fileInputRef}
						onChange={handleFileChange}
						accept="image/*"
						className="hidden"
					/>
				</div>

				<button
					onClick={handleSend}
					className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-medium flex items-center gap-2"
				>
					<span>Send</span>
					<SendIcon className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}
