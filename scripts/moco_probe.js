import dotenv from 'dotenv';
dotenv.config({ path: 'd:\\PX AgenturApp\\PROJECT\\CODE\\2026\\260226\\Visionary-PX-Studio-PSQL\\labs-api\\.env' });

const MOCO_URL = process.env.MOCO_API_URL || 'https://pixelschickeria.mocoapp.com/api/v1';
const MOCO_KEY = process.env.MOCO_API_KEY;

async function probe() {
  const headers = { 'Authorization': `Token token=${MOCO_KEY}` };
  try {
     const resUsers = await fetch(`${MOCO_URL}/users`, { headers });
     const users = await resUsers.json();
     console.log('--- USERS ---');
     console.log(users.slice(0, 1));
     
     if (users.length > 0) {
       console.log('\n--- First User ID ---', users[0].id);
     }

     const resSchedules = await fetch(`${MOCO_URL}/schedules`, { headers });
     console.log('\n--- SCHEDULES ---', resSchedules.status);
     console.log((await resSchedules.json()).slice(0, 1));

     // Try users/absences or report/absences or users/ID/absences
     const resAbsA = await fetch(`${MOCO_URL}/users/absences`, { headers });
     console.log('\n--- USERS/ABSENCES ---', resAbsA.status);

     const resAbsB = await fetch(`${MOCO_URL}/users/${users[0].id}/absences`, { headers });
     console.log('\n--- USERS/[id]/ABSENCES ---', resAbsB.status);
     
     // What about the "report/absences" endpoint we saw?
     // Or "planning" endpoint? I think absences are part of user planning. Let's try.
  } catch (e) {
     console.error(e);
  }
}
probe();
