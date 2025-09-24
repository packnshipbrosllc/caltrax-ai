exports.handler = async (event, context) => {
  // Log all environment variables that start with STRIPE or REACT
  const stripeVars = Object.keys(process.env).filter(key => 
    key.includes('STRIPE') || key.includes('REACT')
  );
  
  const envData = {};
  stripeVars.forEach(key => {
    envData[key] = process.env[key] ? 'EXISTS' : 'MISSING';
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Environment variables debug',
      foundVars: stripeVars,
      envData: envData,
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('STRIPE') || key.includes('REACT') || key.includes('NETLIFY')
      )
    })
  };
};

