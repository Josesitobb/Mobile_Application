const jwt = require ('jsonwebtoken');

const generateToken = (userId) =>{
    return jwt.sign(
        { userId},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRE ||'7d'}
    );
};

const generateRefreshToken = (userId) =>{
    return jwt.sign(
        {userId, type: 'refresh'},
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d'}
    );
};

//VERIFICAR TOKEN 
const verifyToken = (token) =>{
    return jwt.verify(token, process.env.JWT_SECRET);
};

//decodificar token
const decodeToken =(token)=>{
    return jwt.decode(token);
};
module.exports={
    generateToken,
    generateRefreshToken,
    verifyToken,
    decodeToken
};

