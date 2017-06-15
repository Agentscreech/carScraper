angular.module('App')
    .component('homeComp', {
        templateUrl: 'app/containers/home/home.html',
        controller: HomeCompCtrl,
        controllerAs: 'homeComp'
    });

function HomeCompCtrl($scope,$window,CarList,pdfDelegate) {
    var homeComp = this;
    homeComp.cars = "";
    //get a list of the cars
    CarList.getCars().then(function(res){
        //sort by distance closest first.
        res.sort(function(a,b){
            var shorter = a.dist.split(" "), longer = b.dist.split(" ")
            return parseInt(shorter[0]) > parseInt(longer[0]) ? 1 : parseInt(shorter[0]) < parseInt(longer[0]) ? -1 : 0;
        })
        homeComp.cars = res;
        homeComp.cars.forEach(function(car){
            car.pdf = "http://www.windowsticker.forddirect.com/windowsticker.pdf?vin="+car.vin;
            car.showPdf = false;
        });
    });
    homeComp.archive = function(id){
        //flag the car to be archived and not displayed.
        console.log('tried to archive car with id ', id);
        CarList.archiveCar(id).then(function(res){
            document.getElementById(id).remove();
        });
    };
    homeComp.update = function(){
        CarList.updateList().then(function(){
            console.log('trying to refresh');
            $window.location.reload();
        });
    };
}

HomeCompCtrl.$inject = ['$scope','$window','CarList','pdfDelegate'];
