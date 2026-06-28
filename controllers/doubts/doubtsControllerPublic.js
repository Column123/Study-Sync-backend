import Categories  from "../../models/Categories.js";

const getCategories = async(req, res) =>{
    try{
        return res.status(200).json({Categories:Categories});
    }
    catch(err){
        console.log(err);
        return res.sendStatus(500);
    }
}

export default { getCategories };