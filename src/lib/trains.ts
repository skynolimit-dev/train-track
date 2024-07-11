import axios from "axios";
axios.defaults.timeout = 5000;

import axiosRetry from 'axios-retry';
axiosRetry(axios, { retries: 3 });

const API_URI_PREFIX = getApiPrefix();
const MAX_DEPARTURES = 3;

// Get the API URI prefix based on the environment
function getApiPrefix() {
    // If running in production, use the production API URI prefix
    // TODO: Actually use production API URI prefix
    if (process.env.NODE_ENV === 'production') {
        return 'https://train-track-api.fly.dev/api/v1/'
    } else {
        // If running in development, use the development API URI prefix
        return 'http://Mikes-MacBook-Air.local:3000/api/v1/'
    }    
}

// Get train data from the server
export async function getTrainTimes(fromStation: string, toStation: string, retryCount: number = 0) {
    try {
        const response = await axios.get(`${API_URI_PREFIX}departures/from/${fromStation}/to/${toStation}`);
        return response.data;
    } catch (error) {
        // Retry up to 3 times
        if (retryCount < 3) {
            return await getTrainTimes(fromStation, toStation, retryCount + 1);
        }
        console.error(error);
        return {
            error: error
        }
    }
}

// Get the service info from the server
export async function getServiceInfo(serviceId: string, runDate: string) {
    try {
        const response = await axios.get(`${API_URI_PREFIX}service/${serviceId}/runDate/${runDate}`);
        return response.data;
    } catch (error) {
        console.error(error);
        return {
            error: error
        }
    }
}