import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:4000/api'    
});

// Alter defaults after instance has been created
instance.defaults.headers.common['x-access-token'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImVtYWlsIjoiZmlyc3Q1QG1haWwuY29tIiwiY29tcGFueUlkIjoyLCJleHBpcmVzSW4iOjg2NDAwLCJpYXQiOjE1NDY1MjcwMDMsImV4cCI6MTU0NjYxMzQwM30.InkNL_7Mm6Pv4oifkaIKsLCfRNiUNKwaZrcnnl5fOnI';
export default instance;