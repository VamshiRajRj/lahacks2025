export type GraphType = "line" | "bar-y" | "bar-x";

export interface GraphData {
    value: number;
    label?: string;
    marked?: boolean;
}

export interface GraphConfig {
    type: GraphType;
    data: GraphData[];
    width?: number;
    height?: number;
    color?: string;
    markedColor?: string;
    lineWidth?: number;
}

export interface GraphProps extends GraphConfig {
    className?: string;
} 