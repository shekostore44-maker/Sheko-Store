export const siteConfig = {
  name: "Sheko",
  title: "Sheko | متجر شيكو",
  description:
    "متجر Sheko: ساعات وأزياء وإكسسوارات مختارة بعناية، شحن لجميع المحافظات والدفع عند الاستلام.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  // Preview deployments stay out of Google until launch.
  indexable: process.env.NEXT_PUBLIC_SITE_INDEXABLE === "true",
} as const
