/* eslint-disable */
import axios from 'axios';

export const bookTour = async (tourId) => {
  const stripe = Stripe('pk_test_51Pl1LWKiifGcTKjUFs3MEbsSs6enfDV0lTJOj1h6s4mlSWI3yN8hVrYqkdzT5D0uM8z7YFnODUsa3haZDv43EgYc00sJTijJUn');

  try {
    // 1.) Get checkout session from API --> /checkout-session/:tourId
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2.) Use Stripe obj to automatically create a checkout form + charge credit card
    await stripe.redirectToCheckout({ sessionId: session.data.data.id });
  } catch (err) {
    console.error(err);
    showAlert('error', err);
  }
};
