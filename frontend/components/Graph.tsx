"use client";

import { useEffect, useRef } from "react";
import { GraphProps, GraphData } from "@/types/graph";

export default function Graph({
	type,
	data,
	width = 400,
	height = 300,
	color = "#3b82f6",
	markedColor = "#ef4444",
	lineWidth = 2,
	className = "",
}: GraphProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, width, height);

		const maxValue = Math.max(...data.map((d) => d.value)) || 1;
		const xScale = width / (data.length || 1);
		const yScale = (height - 50) / maxValue; // Reserve 50px at bottom for labels

		switch (type) {
			case "bar-y":
				drawVerticalBars(ctx, data, xScale, yScale, color, markedColor);
				break;
			case "bar-x":
				drawHorizontalBars(
					ctx,
					data,
					xScale,
					yScale,
					color,
					markedColor
				);
				break;
		}
	}, [type, data, width, height, color, markedColor, lineWidth]);

	const drawVerticalBars = (
		ctx: CanvasRenderingContext2D,
		data: GraphData[],
		xScale: number,
		yScale: number,
		color: string,
		markedColor: string
	) => {
		const barWidth = xScale * 0.7; // Bars occupy 70% of slot
		const gap = xScale * 0.3; // 30% gap
		const radius = barWidth / 2; // Fully rounded bars

		data.forEach((bar, i) => {
			const x = i * xScale + gap / 2;
			const y = height - 50 - bar.value * yScale;
			const h = bar.value * yScale;

			const baseColor = bar.marked ? markedColor : color;

			// Draw bar with transparent fill
			ctx.fillStyle = baseColor + "4D"; // 30% opacity fill
			ctx.beginPath();
			ctx.moveTo(x + radius, y);
			ctx.lineTo(x + barWidth - radius, y);
			ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
			ctx.lineTo(x + barWidth, y + h - radius);
			ctx.quadraticCurveTo(
				x + barWidth,
				y + h,
				x + barWidth - radius,
				y + h
			);
			ctx.lineTo(x + radius, y + h);
			ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
			ctx.lineTo(x, y + radius);
			ctx.quadraticCurveTo(x, y, x + radius, y);
			ctx.closePath();
			ctx.fill();

			// Draw solid border
			ctx.strokeStyle = baseColor;
			ctx.lineWidth = 2;
			ctx.stroke();

			// Draw label under bars
			if (bar.label) {
				ctx.fillStyle = "#374151";
				ctx.font = "16px 'Inter', sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(
					bar.label.slice(0, 3),
					x + barWidth / 2,
					height - 10
				);
			}
		});
	};

	const drawHorizontalBars = (
		ctx: CanvasRenderingContext2D,
		data: GraphData[],
		xScale: number,
		yScale: number,
		color: string,
		markedColor: string
	) => {
		const maxValue = Math.max(...data.map((d) => d.value)) || 1;
		const slotHeight = height / (data.length || 1);
		const barHeight = slotHeight * 0.7;
		const gap = slotHeight * 0.3;
		const radius = barHeight / 2;

		const paddingLeft = 8; // Add left padding

		data.forEach((bar, i) => {
			const y = i * slotHeight + gap / 2;
			const w = (bar.value / maxValue) * (width * 0.9); // Keep same width scaling
			const baseColor = bar.marked ? markedColor : color;

			// Draw transparent filled bar
			ctx.fillStyle = baseColor + "4D"; // 30% transparent fill
			ctx.beginPath();
			ctx.moveTo(paddingLeft + radius, y);
			ctx.lineTo(paddingLeft + w - radius, y);
			ctx.quadraticCurveTo(
				paddingLeft + w,
				y,
				paddingLeft + w,
				y + radius
			);
			ctx.lineTo(paddingLeft + w, y + barHeight - radius);
			ctx.quadraticCurveTo(
				paddingLeft + w,
				y + barHeight,
				paddingLeft + w - radius,
				y + barHeight
			);
			ctx.lineTo(paddingLeft + radius, y + barHeight);
			ctx.quadraticCurveTo(
				paddingLeft,
				y + barHeight,
				paddingLeft,
				y + barHeight - radius
			);
			ctx.lineTo(paddingLeft, y + radius);
			ctx.quadraticCurveTo(paddingLeft, y, paddingLeft + radius, y);
			ctx.closePath();
			ctx.fill();

			// Stroke the border
			ctx.strokeStyle = baseColor;
			ctx.lineWidth = 2;
			ctx.stroke();

			// Draw label at end of bars
			if (bar.label) {
				ctx.fillStyle = "#374151";
				ctx.font = "13px 'Inter', sans-serif";
				ctx.textAlign = "left";
				ctx.fillText(
					bar.label.slice(0, 3),
					paddingLeft + w + 8,
					y + barHeight / 2 + 4
				);
			}
		});
	};

	return (
		<canvas
			ref={canvasRef}
			width={width}
			height={height}
			className={`rounded-md ${className}`}
		/>
	);
}
