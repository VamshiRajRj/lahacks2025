import { PersonType } from "./PersonType";

export type TransactionItemType = {
    name: string;
    price: number;
};

export type TransactionType = {
    id?: number;
    splitId: number;
    title: string;
    transactionType: "SHOPPING" | "GROCERY" | "DINING" | "ENTERTAINMENT" | "OTHER";
    items: TransactionItemType[];
    splits: {
        person: PersonType;
        amount: number;
    }[];
    billAmount: number;
    paidBy: {person: PersonType, amount: number}[];
    date: string;
    billLink?: string;
};