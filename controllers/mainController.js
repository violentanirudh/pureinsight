exports.getIndex = (req, res) => {
    res.render('index');
};

exports.getAccount = (req, res) => {
    res.render('account');
};

exports.getScan = (req, res) => {
    res.render('scan');
};
