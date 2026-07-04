import { ResearchTemplate } from '../research-schema';

export const ecommerceTemplate: ResearchTemplate = {
  category: "eCommerce",
  keywords: ["shop", "store", "buy", "sell", "retail", "cart", "checkout", "marketplace", "commerce"],
  competitors: [
    { name: "Amazon", category: "Global Marketplace", strengths: ["Logistics", "Prime ecosystem", "Vast selection"], weaknesses: ["Counterfeit issues", "Poor seller support"] },
    { name: "Shopify", category: "Platform", strengths: ["Customizable storefronts", "Strong developer ecosystem"], weaknesses: ["Transaction fees", "Requires setup"] },
    { name: "Etsy", category: "Niche Marketplace", strengths: ["Handmade/vintage focus", "Loyal community"], weaknesses: ["High seller fees", "Increasing mass-produced items"] }
  ],
  commonFeatures: ["Product Catalog", "Search & Filters", "Shopping Cart", "Secure Checkout", "Order Tracking", "Reviews"],
  marketStandards: [
    { category: "Security", expectation: "PCI DSS compliance for payment processing." },
    { category: "UX", expectation: "Frictionless guest checkout options." },
    { category: "Performance", expectation: "Fast page load times, especially for product images." }
  ],
  opportunities: [
    { title: "AR Try-on", description: "Augmented reality features to preview products in real space." },
    { title: "Social Commerce", description: "Seamless shopping directly from social media feeds." }
  ],
  risks: [
    { title: "Supply Chain", description: "Vulnerability to global shipping delays and inventory shortages." },
    { title: "Cart Abandonment", description: "High rates of users leaving before purchase due to hidden costs." }
  ]
};
