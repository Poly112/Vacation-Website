exports.specials = (req, res, next) => {
    res.locals.specials = getSpecialsFromDatabase();
    next();
};

exports.authorize = (req, res, next) => {
    if (req.session.authorized) return next();
    res.render("not-authorized");
};

const staff = {
    mitch: { bio: "Mitch is the man to have at your back in a bar fight." },
    madeline: { bio: "Madeline is our Oregon expert." },
    walt: { bio: "Walt is our Oregon Coast expert." },
};

exports.secret = (req, res) => {
    res.render("secret");
};
exports.subRosa = (req, res) => {
    res.render("sub-rosa");
};
exports.pageWithSpecial = (req, res) => {
    res.render("page-with-specials");
};
exports.staff = (req, res) => {
    var info = staff[req.params.name];
    if (!info) return next(); // will eventually fall through to 404
    res.render("staffer", info);
};
