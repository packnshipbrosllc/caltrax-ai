// Alternative approach - using build-time environment variables
const stripe = require('stripe')(process.env.STRIPESECRETKEY);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { email, name } = JSON.parse(event.body);

    console.log('Creating customer with email:', email);
    console.log('Stripe key available:', !!process.env.STRIPESECRETKEY);

    // Create customer in Stripe
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: {
        source: 'caltrax-ai-signup'
      }
    });

    console.log('Customer created:', customer.id);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        success: true,
        customerId: customer.id,
        message: 'Customer created successfully'
      })
    };

  } catch (error) {
    console.error('Error creating customer:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

