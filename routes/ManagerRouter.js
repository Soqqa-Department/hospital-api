import express from "express";
import createService from "../controllers/Manager/serviceManagement/createService.js"; 
import createAdmin from "../controllers/Manager/adminManagement/createAdmin.js"; 
import updateService from "../controllers/Manager/serviceManagement/updateService.js";
import deleteService from "../controllers/Manager/serviceManagement/deleteService.js";
import createDoctor from "../controllers/Manager/doctorManagement/createDoctor.js"; 
import deleteDoctor from "../controllers/Manager/doctorManagement/deleteDoctor.js"; 
import createMedPackage from "../controllers/Manager/packageManagement/createPackage.js";
import deletePackage from "../controllers/Manager/packageManagement/deletePackage.js";
import deleteAdmin from "../controllers/Manager/adminManagement/deleteAdmin.js";
import getAllAdmins from "../controllers/Manager/adminManagement/getAllAdmins.js";
import searchAdmin from "../controllers/Manager/adminManagement/searchAdmin.js";
import updatePackage from "../controllers/Manager/packageManagement/updatePackage.js";
import addPkgService from '../controllers/Manager/packageManagement/addPkgService.js';
import removePkgService from "../controllers/Manager/packageManagement/removePkgService.js";
import updateDoctor from "../controllers/Manager/doctorManagement/updateDoctor.js"; 
import updateAdmin from "../controllers/Manager/adminManagement/updateAdmin.js";
import undoInpatient from "../controllers/Manager/patientManagement/undoInpatient.js";
import getCardStats from "../controllers/Manager/statsManagement/getCardStats.js";
import getLineChartData from "../controllers/Manager/statsManagement/getChartPaymentStats.js";
import getAllCallLogs from '../controllers/Calls/getAllCallLogs.js';
const router = express.Router();

// Create admin account 
router.post('/admins', createAdmin); 
router.delete('/admins/:id', deleteAdmin); 
router.get('/admins', getAllAdmins);
router.get('/admins/search', searchAdmin); 
router.patch('/admins/', updateAdmin);
// 


// Services 
router.post('/service', createService);
router.patch('/service/:id', updateService); 
router.delete('/service/:id', deleteService); 
//

// Doctors
router.post('/doctor', createDoctor); 
router.delete('/doctor/:id', deleteDoctor); 
router.patch('/doctor', updateDoctor);
//

// Med Packages for stationary patients 
router.post('/package', createMedPackage);
router.delete('/package/:id', deletePackage); 
router.patch('/package', updatePackage);
router.patch('/package/service/add', addPkgService);
router.patch('/package/service/delete', removePkgService); 
//

// Patients
router.patch('/inpatient/undo', undoInpatient);
//

// Statistics
router.get('/stats/cards', getCardStats);
router.get('/stats/chart/payment', getLineChartData);
//

// Calls
router.get('/calls/logs', getAllCallLogs);
//

export default router;
