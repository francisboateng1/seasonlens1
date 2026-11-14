import {Router} from 'express';import {cropList,cropProfiles} from '../data/cropProfiles.js';import {jsonOk} from '../utils/dataFormatter.js';
export const cropsRouter=Router();
cropsRouter.get('/',(req,res)=>res.json(jsonOk(cropList)));
cropsRouter.get('/:cropId',(req,res)=>{const crop=cropProfiles[req.params.cropId];if(!crop)throw Object.assign(new Error('Crop not found.'),{status:404,code:'CROP_NOT_FOUND'});res.json(jsonOk(crop));});
