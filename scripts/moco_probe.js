import dotenv from 'dotenv';
dotenv.config({ path: 'd:\\PX AgenturApp\\PROJECT\\CODE\\2026\\260226\\Visionary-PX-Studio-PSQL\\labs-api\\.env' });

const MOCO_URL = process.env.MOCO_API_URL || 'https://pixelschickeria.mocoapp.com/api/v1';
const MOCO_KEY = process.env.MOCO_API_KEY;

async function probe() {
  const headers = { 'Authorization': `Token token=${MOCO_KEY}` };
  try {
     const resProjects = await fetch(`${MOCO_URL}/projects`, { headers });
     const projects = await resProjects.json();
     console.log('--- PROJECTS ---');
     if (projects.length > 0) {
       console.log(JSON.stringify(projects[0], null, 2));
       
       // Pick a project and see its tasks
       console.log('\n--- TASKS FOR PROJECT ID ' + projects[0].id + ' ---');
       console.log(JSON.stringify(projects[0].tasks, null, 2));
     }
  } catch (e) {
     console.error(e);
  }
}
probe();
