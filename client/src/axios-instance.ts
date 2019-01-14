import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:4000/api'    
});

// Alter defaults after instance has been created

instance.defaults.headers.common['x-access-token'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJmaXJzdDRAbWFpbC5jb20iLCJjb21wYW55SWQiOiIyIiwiZXhwaXJlc0luIjo4NjQwMCwiaWF0IjoxNTQ3NTAxNzkxLCJleHAiOjE1NDc1ODgxOTF9.EH4kUm8zh9b84uDVXtp5KPxHqCx_gos0gAXn_1-Detk';

export default instance;