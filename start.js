import { spawn } from 'child_process';
import path from 'path';

// Start backend server
const backend = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: 'backend',
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

backend.stdout.on('data', (data) => {
  console.log(`[Backend] ${data}`);
});

backend.stderr.on('data', (data) => {
  console.error(`[Backend Error] ${data}`);
});

// Wait a bit for backend to start, then start frontend
setTimeout(() => {
  const frontend = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], {
    cwd: 'frontend',
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
  });

  frontend.stdout.on('data', (data) => {
    console.log(`[Frontend] ${data}`);
  });

  frontend.stderr.on('data', (data) => {
    console.error(`[Frontend Error] ${data}`);
  });
}, 2000);