import { renderToString } from '@vue/server-renderer';
import { createSSRApp } from 'vue';
import InvoiceTemplate from './templates/default.vue';

interface Customer {
    email: string;
    name: string;
    address: string;
}

interface Merchant {
    name: string;
    address: string;
    phone: string;
    email: string;
}

interface ServiceItem {
    service: string;
    description: string;
    hours: number;
    rate: number;
}

interface ProductItem {
    product: string;
    price: number;
    quantity: number;
}

interface CollectorItem {
    service: string;
    description: string;
    amount: number;
}

interface Policy {
    policy: string;
    value: string;
}

export class InvoiceModule {
    constructor(private customer: Customer, private merchant: Merchant) {}

    async create(
        type: 'services' | 'products' | 'collectors',
        items: Array<ServiceItem | ProductItem | CollectorItem>,
        policies: Policy[]
    ): Promise<string> {
        const date = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const invoiceNumber = `INV-${Math.floor(Math.random() * 1000000)
            .toString()
            .padStart(6, '0')}`;

        let subtotal = 0;
        const processedItems = items.map(item => {
            if (type === 'services') {
                const serviceItem = item as ServiceItem;
                const total = serviceItem.hours * serviceItem.rate;
                subtotal += total;
                return { ...serviceItem, total };
            } else if (type === 'products') {
                const productItem = item as ProductItem;
                const total = productItem.price * productItem.quantity;
                subtotal += total;
                return { ...productItem, total };
            } else {
                const collectorItem = item as CollectorItem;
                subtotal += collectorItem.amount;
                return { ...collectorItem, total: collectorItem.amount };
            }
        });

        const taxRate = 0.08;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        const app = createSSRApp(InvoiceTemplate, {
            type,
            invoiceNumber,
            date,
            customer: this.customer,
            merchant: this.merchant,
            items: processedItems,
            subtotal,
            tax,
            total,
            policies,
        });

        // Render the Vue component to a string
        const html = await renderToString(app);
        return html;
    }
}

