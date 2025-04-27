"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraModal({
	open,
	onClose,
	onCapture,
}: {
	open: boolean;
	onClose: () => void;
	onCapture: (photoUrl: string) => void;
}) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [photo, setPhoto] = useState<string | null>(null);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		function handleResize() {
			setIsMobile(window.innerWidth <= 768);
		}
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		async function startCamera() {
			if (navigator.mediaDevices?.getUserMedia) {
				try {
					const mediaStream =
						await navigator.mediaDevices.getUserMedia({
							video: { facingMode: "environment" },
						});
					if (videoRef.current) {
						videoRef.current.srcObject = mediaStream;
					}
					setStream(mediaStream);
				} catch (err) {
					console.error("Error accessing camera", err);
				}
			}
		}

		if (open) {
			startCamera();
		}

		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
				setStream(null);
			}
		};
	}, [open]);

	function capturePhoto() {
		if (!videoRef.current) return;
		const video = videoRef.current;
		const canvas = document.createElement("canvas");

		// Try to capture vertically as mobile camera would want
		if (video.videoWidth > video.videoHeight) {
			// rotate if width > height (landscape)
			canvas.width = video.videoHeight;
			canvas.height = video.videoWidth;
		} else {
			// normal portrait
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
		}

		const ctx = canvas.getContext("2d");
		if (ctx) {
			if (video.videoWidth > video.videoHeight) {
				// Rotate the canvas
				ctx.translate(canvas.width / 2, canvas.height / 2);
				ctx.drawImage(
					video,
					-video.videoWidth / 2,
					-video.videoHeight / 2,
					video.videoWidth,
					video.videoHeight
				);
			} else {
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			}
			const imageData = canvas.toDataURL("image/jpeg", 0.9); // high quality
			setPhoto(imageData);
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
				setStream(null);
			}
		}
	}

	function confirmPhoto() {
		if (photo) {
			onCapture(photo);
			setPhoto(null); // Clear photo after sending
		}
		onClose();
	}

	function retakePhoto() {
		setPhoto(null);
		setStream(null);
		// Restart camera
		setTimeout(() => {
			if (open) {
				navigator.mediaDevices
					.getUserMedia({ video: { facingMode: "environment" } })
					.then((mediaStream) => {
						if (videoRef.current) {
							videoRef.current.srcObject = mediaStream;
						}
						setStream(mediaStream);
					})
					.catch(console.error);
			}
		}, 300);
	}

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
			{!photo ? (
				<>
					<div className="w-full max-w-md relative">
						<div
							className={`w-full ${
								isMobile ? "aspect-[9/16]" : "aspect-[16/9]"
							} bg-black overflow-hidden rounded-lg`}
						>
							<video
								ref={videoRef}
								autoPlay
								playsInline
								muted
								className="object-cover w-full h-full"
							/>
						</div>
					</div>

					<button
						onClick={capturePhoto}
						className="mt-6 px-6 py-3 bg-white text-black font-semibold rounded-full"
					>
						Capture
					</button>
				</>
			) : (
				<>
					<img
						src={photo}
						alt="Captured"
						className="w-full max-w-md rounded-md"
					/>
					<div className="flex gap-4 mt-6">
						<button
							onClick={retakePhoto}
							className="px-6 py-3 bg-gray-300 text-black font-semibold rounded-full"
						>
							Retake
						</button>
						<button
							onClick={confirmPhoto}
							className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-full"
						>
							Done
						</button>
					</div>
				</>
			)}
		</div>
	);
}
