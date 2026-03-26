import axios from 'axios';

export const generatePesapalToken = async (): Promise<string> => {
    try {
        const response = await axios.post(
            'https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken',
            {
                consumer_key: process.env.PESAPAL_CONSUMER_KEY,
                consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
            },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data.token;
    } catch (error) {
        console.error('Error generating Pesapal token:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
        });
        throw new Error('Failed to generate Pesapal token');
    }
};