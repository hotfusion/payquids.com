<template>
  <div class="invoice-container">
    <div class="header">
      <div class="left">
        <p><strong>Invoice Number:</strong> {{ invoiceNumber }}</p>
        <p><strong>Date:</strong> {{ date }}</p>
        <p><strong>Customer:</strong> {{ customer.name }}</p>
        <p><strong>Address:</strong> {{ customer.address }}</p>
      </div>
      <div class="right">
        <h1>{{ merchant.name }}</h1>
        <p>{{ merchant.address }}</p>
        <p>Phone: {{ merchant.phone }}</p>
        <p>Email: {{ merchant.email }}</p>
      </div>
    </div>

    <table>
      <thead v-if="type === 'services'">
      <tr>
        <th>Service</th>
        <th>Description</th>
        <th>Hours</th>
        <th>Rate</th>
        <th>Total</th>
      </tr>
      </thead>
      <thead v-else-if="type === 'products'">
      <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
      </thead>
      <thead v-else>
      <tr>
        <th>Service</th>
        <th>Description</th>
        <th>Amount</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in items" :key="item.service || item.product">
        <td v-if="type === 'services' || type === 'collectors'">{{ item.service }}</td>
        <td v-else>{{ item.product }}</td>
        <td class="description">{{ item.description }}</td>
        <td v-if="type === 'services'">{{ item.hours }}</td>
        <td v-if="type === 'services'">${{ item.rate.toFixed(2) }}/hr</td>
        <td v-if="type === 'products'">{{ item.quantity }}</td>
        <td v-if="type === 'products'">${{ item.price.toFixed(2) }}</td>
        <td>${{ item.total.toFixed(2) }}</td>
      </tr>
      <tr>
        <td :colspan="type === 'collectors' ? 2 : 4" class="total">Subtotal</td>
        <td>${{ subtotal.toFixed(2) }}</td>
      </tr>
      <tr>
        <td :colspan="type === 'collectors' ? 2 : 4" class="total">Tax (8%)</td>
        <td>${{ tax.toFixed(2) }}</td>
      </tr>
      <tr>
        <td :colspan="type === 'collectors' ? 2 : 4" class="total">Total</td>
        <td>${{ total.toFixed(2) }}</td>
      </tr>
      </tbody>
    </table>

    <div class="footer">
      <p v-if="type === 'collectors'">Thank you for choosing our collection services!</p>
      <p v-else>Thank you for choosing our services!</p>
      <ul>
        <li v-for="policy in policies" :key="policy.policy">
          {{ formatPolicy(policy.policy) }}: {{ policy.value }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'InvoiceTemplate',
  props: {
    type: {
      type: String,
      required: true,
      validator: (value: string) => ['services', 'products', 'collectors'].includes(value),
    },
    invoiceNumber: { type: String, required: true },
    date: { type: String, required: true },
    customer: {
      type: Object,
      required: true,
      validator: (obj: any) => 'name' in obj && 'address' in obj && 'email' in obj,
    },
    merchant: {
      type: Object,
      required: true,
      validator: (obj: any) => 'name' in obj && 'address' in obj && 'phone' in obj && 'email' in obj,
    },
    items: { type: Array, required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    policies: {
      type: Array,
      required: true,
      validator: (arr: any[]) => arr.every(item => 'policy' in item && 'value' in item),
    },
  },
  methods: {
    formatPolicy(policy: string): string {
      return policy
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    },
  },
});
</script>

<style scoped>
.invoice-container {
  max-width: 600px;
  margin: 0 auto;
  background-color: #fff;
  padding: 20px;
  border: 1px solid #ddd;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.header {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
  margin-bottom: 20px;
}
.header .left,
.header .right {
  text-align: left;
  font-size: 12px;
}
.header .right {
  text-align: right;
}
.header h1 {
  margin: 0;
  font-size: 18px;
}
.header p {
  margin: 5px 0;
  color: #555;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
th,
td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}
th {
  background-color: #f8f8f8;
}
.description {
  font-size: 12px;
  color: #666;
}
.total {
  font-weight: bold;
  text-align: right;
}
.footer {
  margin-top: 20px;
  color: #555;
  font-size: 10px;
  text-align: left;
}
.footer ul {
  list-style-type: none;
  padding: 0;
}
.footer li {
  margin: 5px 0;
}
</style>