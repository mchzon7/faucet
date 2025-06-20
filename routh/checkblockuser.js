module.exports = async (req, res , next) => {
    if(!req.session.user){
        return res.redirect('/login');
    }
    const checkblock = req.session.user;
    if(checkblock.isBlocked == false) {
        return next();
    }

    req.flash('error_msg', 'Your account have been block contact support');
    return res.redirect('/login');

    
}