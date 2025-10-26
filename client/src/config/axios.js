import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5000'; // Your backend URL
axios.defaults.withCredentials = true;

export default axios;