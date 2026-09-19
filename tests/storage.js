const STORAGE_KEY = 'eyp_tests_v6_3_local';
const PARTICIPANT_KEY = 'eyp_tests_participant';
export const SCHEMA_VERSION = 3;

function uuid(){
  if(globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
}

export function getParticipantId(){
  let id = localStorage.getItem(PARTICIPANT_KEY);
  if(!id){
    id=uuid();
    try{localStorage.setItem(PARTICIPANT_KEY,id)}catch{}
  }
  return id;
}

export function loadLocalDb(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(parsed && parsed.schemaVersion===SCHEMA_VERSION && Array.isArray(parsed.runs)){
      if(!parsed.participantId) parsed.participantId=getParticipantId();
      return parsed;
    }
  }catch{}
  return {schemaVersion:SCHEMA_VERSION,participantId:getParticipantId(),runs:[]};
}

export function saveLocalDb(db){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(db))}catch{}
}

export function clearLocalDb(){
  localStorage.removeItem(STORAGE_KEY);
}
