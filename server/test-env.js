require('dotenv').config({ path: require('path').join(__dirname, '.env') });

console.log('Environment variables:');
console.log('MONGO_URI:', process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + '...' : 'Not found');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
