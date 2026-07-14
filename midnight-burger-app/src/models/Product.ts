// src/models/Product.ts

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category?: string;
    imageUrl?: string;
    available?: boolean;
    orderIndex?: number;
}