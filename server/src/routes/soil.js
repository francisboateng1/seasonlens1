import {Router} from 'express';import {getSoilGridsStatus} from '../services/soilGrids.js';import {soilProfiles} from '../data/soilProfiles.js';import {jsonOk} from '../utils/dataFormatter.js';
export const soilRouter=Router();soilRouter.get('/status',(req,res)=>res.json(jsonOk({...getSoilGridsStatus(),profile:soilProfiles})));
