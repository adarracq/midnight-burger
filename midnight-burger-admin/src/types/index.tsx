// src/types/index.ts

export interface Order {
    id: string;
    totalAmount: number;
    status: string;
    deliveryAddress?: { street: string; city: string; details: string, lat: number; lng: number };
    items: { name: string; quantity: number, note: string }[];
    phone: string;
    firstName?: string;
    lastName?: string;
    pseudo?: string;
    createdAt: any;
    deliveringAt?: any;
    completedAt?: any;
    canceledAt?: any;
    cancellationReason?: string;
}