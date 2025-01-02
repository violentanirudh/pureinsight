exports.getIndex = (req, res) => {
    res.render('index');
};

exports.getAccount = (req, res) => {
    if (req.cookies.token) {
        return res.redirect('/scan'); 
    }
    res.render('account');
};
