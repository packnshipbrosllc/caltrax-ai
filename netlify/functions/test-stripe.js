// Test function to check if Stripe works with hardcoded key
const stripe = require('stripe')('sk_test_51234567890abcdef'); // Test key

exports.handler = async (event, context) => {
  try {
    // Test Stripe connection
    const account = await stripe.accounts.retrieve();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Stripe connection test successful',
        accountId: account.id
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};


