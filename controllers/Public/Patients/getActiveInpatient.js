
const getActiveInpatient = async (req, res, next) => {
    const { Patient } = req.models;

  try{ 
    const now = new Date();
    const projection = {
      _id: 1,
      firstName: 1,
      lastName: 1,
      startedAt: 1,
      expiresAt: 1,
      PCP: 1,
      packages: 1
    };

    const query = {
      expiresAt: { $gte: now }
    };

    // const patients = await Patient.find(query, projection);
    const patients = await Patient.find(query, projection)
      .populate({
        path: "PCP",
        model: "users",
        select: "_id firstName lastName"
      })
      .populate({
        path: 'packages', 
        model: 'MedPackages', 
        select: '_id title price'
      });

    return res.status(200).json({success: true, patients});
  }catch(err){
    return next(err);
  }
}

export default getActiveInpatient;