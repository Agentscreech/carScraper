var db = require('./models');
// var Promise = require('bluebird');
// var request = Promise.promisifyAll(require("request"));
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
var request = require('request-promise');


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
    console.log("starting update on backend")
    updateList();
    // setInterval(updateList(), 120000);
    res.sendStatus(200);
});

//root route and server port
app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname, 'static/index.html'));
});
var server = app.listen((process.env.PORT || 1337), function() {
    console.log('listening on 1337');
});




//helper functions

function updateList() {
    console.log("interval firing")
    var OPTIONS = {
        url: 'http://www.autotrader.com/cars-for-sale/2017/Ford/Mustang/Lynnwood+WA-98036?zip=98036&extColorsSimple=BLUE&startYear=2017&numRecords=100&incremental=all&endYear=2017&modelCodeList=MUST&makeCodeList=FORD&sortBy=distanceASC&firstRecord=0&searchRadius=1200&trimCodeList=MUST%7CShelby%20GT350',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
        }

    };
    var newCarsListed = [];
    var url = ""
    var distance = ""
    //grab the search results and then send each listed URL to the function that grabs the data we want.
    request(OPTIONS).then(function(body) {
        var carsScraped = [];
            if (body) {
                var $ = cheerio.load(body);
                var results = $('a[data-qaid="lnk-lstgTtlf"]');
                var dist = $('[data-qaid="cntnr-dlrlstng-radius"]');
                console.log("found " + results.length);
                for (var i = 0; i < results.length; i++) {
                    url = "http://www.autotrader.com/" + results[i].attribs.href;
                    distance = dist[i].children[0].data;
                    carsScraped.push([url, distance]);
                    }
            };
            console.log("parsed ", carsScraped.length, " cars")
            return carsScraped
            // deleteExpiredListings();
        }).then(function(cars){
            console.log("request is done, going to first promise");
            var counter = 0;
            cars.forEach(function(singleCar){
                url = singleCar[0]
                distance = singleCar[1]
                getCarDetails(OPTIONS, url, distance).then(function(carDetails){
                    console.log("getDetails done, firing update")
                    updateDB(carDetails).then(function(carUpdated){
                        console.log("update promise should be done")
                        if(carUpdated){
                            newCarsListed.push(carUpdated);
                        }
                        counter++
                        console.log("checking counter", counter)
                        if (counter == cars.length){
                            console.log("everything is updated, checking is newCarsListed has anything");
                            if (newCarsListed.length > 0) {
                                //send email with new cars
                                console.log("new car(s) found, should send email with ", newCarsListed);
                                // sendEmail(newCarsListed);
                            } else {
                                console.log("no new cars to email")
                            }
                            deleteExpiredListings();
                        }
                    })
                })
            })
        })
}


function getCarDetails(OPTIONS, url, dist) {
    return new Promise(function(resolve,reject){
        OPTIONS.url = url;
        request(OPTIONS).then(function(body) {
            if (body) {
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
            }
            if (car)
                resolve(car);
            });
    })
}

function updateDB(car) {
    return new Promise(function(resolve, reject){
        db.car.find({
            where: {
                vin: car.vin
            }
        }).then(function(result) {
            if (!result) {
                console.log("adding new car", car);
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
                resolve(car)
            } else {
                //update the listing
                if (car.price != result.price) {
                    console.log("updating price");
                    db.car.update({
                        price: car.price
                    }, {
                        where: {
                            vin: car.vin
                        }
                    });
                    };
                resolve();
            }

        });
    })
}

function deleteExpiredListings() {
    db.car.findAll().then(function(cars) {
        cars.forEach(function(car) {
            var url = car.dataValues.url
            var options = {
                url: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
                }
            }
            request(options).then(function(body) {
                if (body) {
                    var $ = cheerio.load(body);
                    if (!$('[data-qaid="cntnr-vehicle-title-header"] [title]').text()) {
                        console.log('removing url', car.url)
                        db.car.destroy({
                            where: {
                                url: car.url
                            }
                        })
                    } else {
                        console.log("url still works")
                    }
                }
            });
        })
    });
}


//email setup

function sendEmail(cars) {

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.emailName,
            pass: process.env.emailPassword
        }
    });

    var mailOptions = {
        from: 'yourComputer@mac.com',
        to: 'exoticimage@hotmail.com',
        subject: 'New GT350 found!',
        text: 'There is a new car found!.  Check the site!'
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}
