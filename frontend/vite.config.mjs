import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{outDir:'.local/game-release/build',emptyOutDir:true,lib:{entry:'frontend/entry.jsx',name:'EmailDeskQuest',formats:['iife'],fileName:()=> 'quest.js'},minify:true}});
