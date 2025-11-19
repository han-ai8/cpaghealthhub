import axios from 'axios';

axios.defaults.baseURL = 'api.cpaghealthhub.com'; // Your backend URL  'http://localhost:5000' 
axios.defaults.withCredentials = true;

export default axios;