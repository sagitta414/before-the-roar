// A stopped or superseded connection must never start a background match.
export function createLabRun({create,stop}){
 let generation=0,current=null;
 return {
  get:()=>current,
  async start(input){
   const ticket=++generation;
   const previous=current;current=null;
   if(previous)await stop(previous).catch(()=>{});
   if(ticket!==generation)return null;
   const result=await create(input);
   if(ticket!==generation){await stop(result).catch(()=>{});return null;}
   current=result;return result;
  },
  async stop(){
   generation++;const previous=current;current=null;
   if(previous)await stop(previous).catch(()=>{});
  }
 };
}
