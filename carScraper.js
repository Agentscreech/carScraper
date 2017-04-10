var request = require('request');
var cheerio = require('cheerio');
var db = require('./models');


//URL for the cars we want to look for.
var OPTIONS = {
    url:'http://www.autotrader.com/cars-for-sale/2017/Ford/Mustang/Lynnwood+WA-98036?zip=98036&extColorsSimple=BLUE&startYear=2017&numRecords=100&incremental=all&endYear=2017&modelCodeList=MUST&makeCodeList=FORD&sortBy=distanceASC&firstRecord=0&searchRadius=1200&trimCodeList=MUST%7CShelby%20GT350',
    headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
  }

};


//grab the search results and then send each listed URL to the function that grabs the data we want.
request(OPTIONS, function(err, response, body){
    // console.log(body);
    var $ = cheerio.load(body);
    var results = $('a[data-qaid="lnk-lstgTtlf"]');
    var dist = $('data-qaid="cntnr-dlrlstng-radius"]');
    //could be rewritten as results.each(function(index, result))
    for (var i = 0; i<results.length; i++){
      var url = "http://www.autotrader.com/"+results[i].attribs.href;
      getCarDetails(url, dist);
    }
});


//
function getCarDetails(url,dist){
  OPTIONS.url = url;
  request(OPTIONS, function(err,res,body){
    var $ = cheerio.load(body);
    var car = {
        name: $('[data-qaid="cntnr-vehicle-title-header"] [title]').text(),
        url: OPTIONS.url,
        color: $('[data-qaid="cntnr-exteriorColor"]').text(),
        price: $('[data-qaid="cntnr-pricing-cmp-outer"]').text(),
        vin: $('[data-qaid="tbl-value-VIN"]').text(),
        dealer: $('[data-qaid="dealer_name"]').text(),
        address: $('[itemprop="address"]').text(),
        phone: $('[data-qaid="dlr_phone"]').text(),
        pic: $('.media-viewer img').attr('src'),
        dist: dist
    };
    console.log(car);
    //now store the car to the DB, checking by VIN for repeats
    db.car.findOrCreate({
      where: {
        name: car.name,
        vin:car.vin,
        url:car.url,
        color: car.color,
        price: car.price,
        dealer: car.dealer,
        address: car.address,
        phone: car.phone,
        pic: car.pic
      }
    });
  });

}



// this should embed the pdf into a frame to view
//<embed src="http://windowsticker.forddirect.com/windowsticker.pdf?vin="+car.vin width="500" height="375" type='application/pdf'>
