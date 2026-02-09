const fs=require('fs'); let c=fs.readFileSync('server/storage.ts','utf8'); c=c.replace(/name: "Fairfax",/g, 'userId: "demo-system", name: "Fairfax",'); fs.writeFileSync('server/storage.ts',c);  
