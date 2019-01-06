import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:4000/api'    
});

// Alter defaults after instance has been created
instance.defaults.headers.common['x-access-token'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsImVtYWlsIjoiZmlyc3Q1QG1haWwuY29tIiwiY29tcGFueUlkIjoyLCJleHBpcmVzSW4iOjg2NDAwLCJpYXQiOjE1NDY3Mjk3MjUsImV4cCI6MTU0NjgxNjEyNX0.hYTxBTUgCvq02UuDzxOmTCBMgm3x8LPmpzpD52WVU_w';
export default instance;