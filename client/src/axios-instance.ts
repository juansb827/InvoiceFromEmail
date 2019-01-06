import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:4000/api'    
});

// Alter defaults after instance has been created
instance.defaults.headers.common['x-access-token'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImVtYWlsIjoiZmlyc3Q1QG1haWwuY29tIiwiY29tcGFueUlkIjoyLCJleHBpcmVzSW4iOjg2NDAwLCJpYXQiOjE1NDY4MTY3NTMsImV4cCI6MTU0NjkwMzE1M30.jWVu4E3avAUAvhtUTc8YY7Y2QmZBw2YTUPbI1A74WVM';
export default instance;