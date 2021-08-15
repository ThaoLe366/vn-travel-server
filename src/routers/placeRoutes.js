const {Place} =require("../models/index")
const express =require("express")
const router=express.Router();
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");


//GET ALL:PLACES
router.get('/', async(req, res)=>{
    try{
        const placeList= await Place.find();
       return  res.status(200).json({
                   message: "All places",
                   count: placeList.length,
                   places: placeList,
                 });
    }
    catch(err){
         res.status(500).json({
                    message: "Cannot get place list",
                    count: 0,
                    places: [],
                  });
    }
})

//POST: Create new place
router.post('/', requireAuth,async(req,res, next)=> requireRole("admin", req, res, next, async(req,res,next)=>{
        let place= new Place({
            name:req.body.name,
            description:req.body.description,
            longtitude:req.body.longtitude,
            lattitude:req.body.lattitude,
            tadId:req.body.tadId,
            rate:req.body.rate,
            weight:req.body.weight,
            province:req.body.province,
            status:req.body.status,
            closeTime:req.body.closeTime,
            openTime:req.body.openTime,
            price:req.body.price
        })
        place= await place.save();
        if(!place){
            return  res.status(500).json({
                        message: "Cannot create place",
                      });
        }
        return  res.status(200).json({
                    message: "Create place successfully",
                    count: 1,
                    places  : place,
                  });
}))


module.exports=router;