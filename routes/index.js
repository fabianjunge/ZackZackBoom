
/*
 * GET home page.
 */

exports.intro = function(req, res){
  res.render('intro', { title: 'Intro' });
};

exports.index = function(req, res){
  res.render('index', { title: 'ZackZackBoom' });
};

exports.socket = function(req, res){
  res.render('socket', { title: 'Socket' });
};
