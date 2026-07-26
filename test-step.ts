import { createWebhookEventStep } from "./apps/backend/src/workflows/payments/steps"
console.log(typeof (createWebhookEventStep as any).__step__)
console.log(Object.keys((createWebhookEventStep as any).__step__))
