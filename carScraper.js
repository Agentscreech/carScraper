//need to get the page and render it?

//once rendered, filter it and scrape what you want


//this gets the links to all the results in array test[0].href is the link
var cars = document.querySelectorAll("a[data-qaid='lnk-lstgTtlf']");

//once you get the response from the individual car, you can get all the info we need from it like this.

var car = {
    color: document.querySelector('[data-qaid="cntnr-exteriorColor"]').innerText,
    price: document.querySelector('[data-qaid="cntnr-pricing-cmp-outer"]').innerText,
    vin: document.querySelector('[data-qaid="tbl-value-VIN"]').innerText,
    dealer: document.querySelector('[data-qaid="dealer_name"]').innerText,
    address: document.querySelector('[itemprop="address"]').innerText,
    phone: document.querySelector('[data-qaid="dlr_phone"]').innerText,
    pic: document.querySelector("div.media-viewer img").src
};

// this should embed the pdf into a frame to view
//<embed src="http://windowsticker.forddirect.com/windowsticker.pdf?vin="+car.vin width="500" height="375" type='application/pdf'>
