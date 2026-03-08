export type BookDistributor = 'amazon' | 'stripe' | 'barnes_and_noble' | 'ingram_spark' | 'local_booksellers';

export const BOOK_ROUTING = {
  // Change this value to easily reroute the "Book Bump" button to different platforms
  ACTIVE_PROVIDER: 'amazon' as BookDistributor,

  PROVIDERS: {
    amazon: {
      name: 'Amazon',
      // We can use the existing env var or hardcode the Amazon link here
      url: import.meta.env.VITE_BOOK_ORDER_URL || 'https://amazon.com', 
      buttonText: 'Yes — Get The Book on Amazon',
      description: 'Get the physical book shipped fast via Amazon.'
    },
    stripe: {
      name: 'Direct (Free + Shipping)',
      url: import.meta.env.VITE_STRIPE_CHECKOUT_URL || '#',
      buttonText: 'Yes — Send Me The Printed Book',
      description: "Want the physical book? It's free — you cover shipping. The kind of thing that ends up dog-eared on a workbench."
    },
    barnes_and_noble: {
      name: 'Barnes & Noble',
      url: '#', // Add B&N URL when ready
      buttonText: 'Yes — Get The Book on B&N',
      description: 'Support retail bookstores and get the physical book.'
    },
    ingram_spark: {
      name: 'Ingram Spark',
      url: '#', // Add Ingram URL when ready
      buttonText: 'Yes — Order The Printed Book',
      description: 'Order the physical book direct from the printer.'
    },
    local_booksellers: {
      name: 'Local Booksellers',
      url: '#', // Add Bookshop.org or IndieBound URL when ready
      buttonText: 'Yes — Support Local Bookstores',
      description: 'Order the physical book and support your local independent bookstore.'
    }
  }
};

export const getActiveBookRoute = () => {
  return BOOK_ROUTING.PROVIDERS[BOOK_ROUTING.ACTIVE_PROVIDER];
};
