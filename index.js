var db = require('./models');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var request = require('request');
var app = express();
var cheerio = require('cheerio');

app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(express.static(path.join(__dirname + '/static/')));

app.get('/api/cars/all', function(req, res) {
    db.car.findAll().then(function(cars) {
        res.send(cars);
    });
});

app.put('/api/cars/archive/:id', function(req, res) {
    db.car.findOne({
        where: {
            id: req.params.id
        }
    }).then(function(car) {
        car.update({
            archived: true
        });
    }).then(function(car) {
        res.sendStatus(200);
    });
});

app.get('/api/updateList', function(req, res) {
    var OPTIONS = {
        url: 'http://www.autotrader.com/cars-for-sale/2017/Ford/Mustang/Lynnwood+WA-98036?zip=98036&extColorsSimple=BLUE&startYear=2017&numRecords=100&incremental=all&endYear=2017&modelCodeList=MUST&makeCodeList=FORD&sortBy=distanceASC&firstRecord=0&searchRadius=1200&trimCodeList=MUST%7CShelby%20GT350',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
        }

    };

    //grab the search results and then send each listed URL to the function that grabs the data we want.
    request(OPTIONS, function(err, response, body) {
        var $ = cheerio.load(body);
        var results = $('a[data-qaid="lnk-lstgTtlf"]');
        var dist = $('[data-qaid="cntnr-dlrlstng-radius"]');
        //could be rewritten as results.each(function(index, result))
        console.log("found "+results.length);
        for (var i = 0; i < results.length; i++) {
            var url = "http://www.autotrader.com/" + results[i].attribs.href;
            getCarDetails(OPTIONS,url,dist[i].children[0].data,function(car){
                updateDB(car);

            });
        }
        res.sendStatus(200);
    });
    //now to clean up any expired listings
    deleteExpiredListings();



});


//root route and server port
app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname, 'static/index.html'));
});
var server = app.listen((process.env.PORT || 1337), function() {
    console.log('listening on 1337');
});


//helper functions

function getCarDetails(OPTIONS,url,dist,callback) {
    OPTIONS.url = url;
    request(OPTIONS, function(err, res, body) {
        var $ = cheerio.load(body);
        var car = {
            name: $('[data-qaid="cntnr-vehicle-title-header"] [title]').text(),
            url: url,
            color: $('[data-qaid="cntnr-exteriorColor"]').text(),
            price: $('[data-qaid="cntnr-pricing-cmp-outer"]').text(),
            vin: $('[data-qaid="tbl-value-VIN"]').text(),
            dealer: $('[data-qaid="dealer_name"]').text(),
            address: $('[itemprop="address"]').text(),
            phone: $('[data-qaid="dlr_phone"]').text(),
            pic: $('.media-viewer img').attr('src'),
            dist: dist
        }
        callback(car);
    });

}

function updateDB(car){
    db.car.find({
        where: {
            vin: car.vin
        }
    }).then(function(result){
        if (!result){
            console.log("adding new car");
            db.car.create({
                name: car.name,
                vin: car.vin,
                url: car.url,
                color: car.color,
                price: car.price,
                dealer: car.dealer,
                address: car.address,
                phone: car.phone,
                pic: car.pic,
                dist: car.dist
            });
        } else {
            //update the listing
            if (car.price != result.price){
                console.log("updating price");
                db.car.update({
                    price: car.price
                },{where: {vin: car.vin}});
            }
        }
        return false;
    });
}

function deleteExpiredListings(){
    db.car.findAll().then(function(cars){
        cars.forEach(function(car){
            var url = car.dataValues.url
            var options = {
                url: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
                }
            }
            request(options, function(err, res, body){
                var $ = cheerio.load(body);
                // console.log("!!!! TESTING ID ",car.id,test)
                if (!$('[data-qaid="cntnr-vehicle-title-header"] [title]').text()){
                    console.log("should be deleted", car.id)
                    db.car.destroy({where: {url: car.url}})
                }
            });
        })
    });
}
