import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from '@vue/compiler-sfc';
//@ts-ignore
import { createServer } from 'vite';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp } from 'vue';
import juice from 'juice';
//@ts-ignore
import vue from '@vitejs/plugin-vue';
interface Customer { email: string; name: string; address: string; }
interface Merchant { name: string; address: string; phone: string; email: string; }
interface ServiceItem { service: string; description: string; hours: number; rate: number; }
interface ProductItem { product: string; price: number; quantity: number; }
interface CollectorItem { service: string; description: string; amount: number; }
interface Policy { policy: string; value: string; }

export class InvoiceModule {
    constructor(private customer: Partial<Customer>, private merchant: Partial<Merchant>) {}

    private async compileVueFile(file: string) {
        // Dynamically import ESM-only packages inside async function
        const { parse, compileScript, compileTemplate } = await import('@vue/compiler-sfc');

        const filepath = resolve(__dirname, 'templates', `${file}.vue`);
        const source = readFileSync(filepath, 'utf-8');

        // Parse the SFC
        const { descriptor } = parse(source);

        // Compile <script setup>
        const script = compileScript(descriptor, { id: 'invoice' });

        // Compile <template>
        const template = compileTemplate({
            id: 'invoice',
            source: descriptor.template?.content || '',
            filename: filepath,
        });

        // Combine compiled script + template into a component
        const component = new Function(
            'require',
            `${script.content}; return { ...exports, render: (${template.code}) }`
        )(require);

        return component;
    }

    convertDraftToMongo(draftSchema){
        function mapType(type) {
            if (Array.isArray(type)) return type.map(mapType);

            switch (type) {
                case "string":
                    return "string";
                case "number":
                    return "double"; // could also be "decimal"
                case "integer":
                    return "int"; // or "long" depending on your use case
                case "boolean":
                    return "bool";
                case "array":
                    return "array";
                case "object":
                    return "object";
                case "null":
                    return "null";
                default:
                    return type; // fallback
            }
        }
        function transform(schema) {
            if (typeof schema !== "object" || schema === null) return schema;

            const newSchema:any = {};

            for (const [key, value] of Object.entries(schema)) {
                switch (key) {
                    case "$schema":
                    case "$ref":
                    case "definitions":
                    case "title":
                    case "description":
                    case "default":
                    case "examples":
                    case "format":
                        // MongoDB does not support these
                        continue;

                    case "type":
                        newSchema.bsonType = mapType(value);
                        break;

                    case "properties":
                        newSchema.properties = {};
                        for (const [prop, propSchema] of Object.entries(value)) {
                            newSchema.properties[prop] = transform(propSchema);
                        }
                        break;

                    case "items":
                        if (Array.isArray(value)) {
                            newSchema.items = value.map(transform);
                        } else {
                            newSchema.items = transform(value);
                        }
                        break;

                    case "anyOf":
                    case "oneOf":
                    case "allOf":
                        newSchema[key] = (<any>value).map(transform);
                        break;

                    case "not":
                        newSchema.not = transform(value);
                        break;

                    // Keep known validation keywords directly
                    case "required":
                    case "enum":
                    case "minimum":
                    case "maximum":
                    case "exclusiveMinimum":
                    case "exclusiveMaximum":
                    case "multipleOf":
                    case "minLength":
                    case "maxLength":
                    case "pattern":
                    case "minItems":
                    case "maxItems":
                    case "uniqueItems":
                    case "additionalProperties":
                        newSchema[key] = value;
                        break;

                    default:
                        // Recurse for any other objects
                        newSchema[key] = transform(value);
                }
            }

            return newSchema;
        }

        return transform(draftSchema);
    }
    async create(
        type: 'services' | 'products' | 'collectors',
        items: Array<ServiceItem | ProductItem | CollectorItem>,
        policies: Policy[],
        template: string = 'default'
    ): Promise<string> {
        const vite = await createServer({
            server: { middlewareMode: true },
            appType: 'custom',
            plugins: [(await import('@vitejs/plugin-vue')).default()],
        });

        try {
            // 1. Load Vue component
            const Component = (await vite.ssrLoadModule(
                resolve(__dirname, `./templates/${template}.vue`)
            )).default;

            console.log(Component)
            // 2. Prepare data for invoice
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
                    const total = (item as ServiceItem).hours * (item as ServiceItem).rate;
                    subtotal += total;
                    return { ...item, total };
                } else if (type === 'products') {
                    const total = (item as ProductItem).price * (item as ProductItem).quantity;
                    subtotal += total;
                    return { ...item, total };
                } else {
                    subtotal += (item as CollectorItem).amount;
                    return { ...item, total: (item as CollectorItem).amount };
                }
            });
            function extractVueStyles(file: string): string {
                const filepath = resolve(__dirname, 'templates', `${file}.vue`);
                const source = readFileSync(filepath, 'utf-8');
                const { descriptor } = parse(source);

                return descriptor.styles.map(s => s.content).join('\n');
            }
            const taxRate = 0.08;
            const tax = subtotal * taxRate;
            const total = subtotal + tax;

            // 3. Pass arguments (props) to Vue component
            const app = createSSRApp(Component, {
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

            // 4. Render HTML
            const rawHtml = await renderToString(app);

            // extract CSS from .vue file
            const styles = extractVueStyles(template);

            // inline CSS into HTML (for email safety)
            return juice(`<style>${styles}</style>${rawHtml}`);
        } finally {
            await vite.close();
        }
    }

}

