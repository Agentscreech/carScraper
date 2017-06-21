angular.module('App')
    .component('homeComp', {
        templateUrl: 'app/containers/home/home.html',
        controller: HomeCompCtrl,
        controllerAs: 'homeComp'
    });

function HomeCompCtrl($scope,$window,CarList,$sce) {
    var homeComp = this;
    homeComp.cars = "";
    //get a list of the cars
    CarList.getCars().then(function(res){
        //rank cars by price and distance
        homeComp.cars = rankCars(res);

        // homeComp.cars = res;
        homeComp.cars.forEach(function(car){
            car.pdf = $sce.trustAsResourceUrl("http://www.windowsticker.forddirect.com/windowsticker.pdf?vin="+car.vin);
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
//sorting helper
function rankCars(cars){
    cars = cars.filter(function(car){
        return car.archived == false;
    });
    var carsByDistance = cars.slice(0).sort(function(a,b){
        var arr1 = a.dist.split(" "), arr2 = b.dist.split(" ");
        var aa = parseInt(arr1[0]), bb = parseInt(arr2[0]);
        if (aa > bb){
            return 1
        }
        if (aa < bb){
            return -1
        }
        return 0
        // return aa < bb ? 1 : aa > bb ? -1 : 0;
    });
    // console.log("distance ",carsByDistance);
    var carsByPrice = cars.sort(function(a,b){
            var arr1 = a.price.split("$"), arr2 = b.price.split("$");
            if (arr1 == ""){
                arr1 = ["","999,999"]
            }
            if (arr2 == ""){
                arr2 = ["","999,999"]
            }
            return parseInt(arr1[1].split(",").join("")) > parseInt(arr2[1].split(",").join("")) ? 1 : parseInt(arr1[1].split(",").join("")) < parseInt(arr2[1].split(",").join("")) ? -1 : 0;

    });
    // console.log(carsByPrice);
    //for each car, find the index of it in each of the arrays then add them and manually create a new array with the new index.
    cars.forEach(function(car){
        var rank = carsByDistance.indexOf(car) + carsByPrice.indexOf(car) - 1;
        // console.log("Car with price " +car.price+" and distance of "+car.dist+" has a rank of "+rank);
        car.rank = rank;
    });
    cars.sort(function(a,b){
        return a.rank-b.rank;
    });
    // rankedList = rankedList.filter(Boolean);
    // return rankedList;
    return cars
}

HomeCompCtrl.$inject = ['$scope','$window','CarList','$sce'];
